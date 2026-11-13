package com.resume.shortlister.service;

import com.resume.shortlister.audit.AuditLog;
import com.resume.shortlister.audit.AuditLogParams;
import com.resume.shortlister.audit.AuditService;
import com.resume.shortlister.domain.Candidate;
import com.resume.shortlister.domain.Job;
import com.resume.shortlister.domain.JobApplication;
import com.resume.shortlister.dto.JobApplicationRequest;
import com.resume.shortlister.dto.JobApplicationResponse;
import com.resume.shortlister.mapper.JobApplicationMapper;
import com.resume.shortlister.repository.CandidateRepository;
import com.resume.shortlister.repository.JobApplicationRepository;
import com.resume.shortlister.repository.JobRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class JobApplicationService {

    private final JobApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final CandidateRepository candidateRepository;
    private final JobApplicationMapper applicationMapper;
    private final AuditService auditService;

    @Transactional
    @CacheEvict(value = "jobs", allEntries = true)
    public JobApplicationResponse apply(JobApplicationRequest request,
                                        UUID applicantId,
                                        HttpServletRequest httpRequest) {
        Job job = jobRepository.findById(request.getJobId())
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + request.getJobId()));

        if (applicationRepository.existsByJobIdAndApplicantId(request.getJobId(), applicantId)) {
            auditService.log(AuditLogParams.builder()
                    .action(AuditLog.Action.JOB_CREATE)
                    .userId(applicantId)
                    .entityType("JobApplication")
                    .request(httpRequest)
                    .success(false)
                    .errorMessage("Already applied to this job")
                    .details(Map.of("jobId", request.getJobId(), "applicantId", applicantId))
                    .build());
            throw new IllegalArgumentException("You have already applied to this job");
        }

        JobApplication application = applicationMapper.toEntity(request);
        application.setApplicantId(applicantId);
        application.setStatus(JobApplication.ApplicationStatus.PENDING);
        if (application.getRemotePreference() == null) {
            application.setRemotePreference(Job.RemoteWorkMode.ON_SITE);
        }
        if (application.getSalaryExpectation() == null) {
            application.setSalaryExpectation(0);
        }
        if (application.getCurrency() == null) {
            application.setCurrency("USD");
        }
        application = applicationRepository.save(application);

        // Create a candidate profile so the application shows up in the recruiter's account
        createCandidateFromApplication(application);

        auditService.log(AuditLogParams.builder()
                .action(AuditLog.Action.JOB_CREATE)
                .userId(applicantId)
                .entityType("JobApplication")
                .entityId(application.getId())
                .request(httpRequest)
                .success(true)
                .details(Map.of("jobId", job.getId(), "jobTitle", job.getTitle(),
                        "applicantEmail", application.getEmail()))
                .build());

        return toResponse(application, job.getTitle());
    }

    public JobApplicationResponse getById(UUID id, UUID applicantId,
                                          boolean isRecruiter, HttpServletRequest httpRequest) {
        JobApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Application not found: " + id));

        if (!isRecruiter && !application.getApplicantId().equals(applicantId)) {
            throw new IllegalArgumentException("Access denied: you can only view your own applications");
        }

        Job job = jobRepository.findById(application.getJobId()).orElse(null);

        auditService.log(AuditLogParams.builder()
                .action(AuditLog.Action.JOB_READ)
                .userId(applicantId)
                .entityType("JobApplication")
                .entityId(id)
                .request(httpRequest)
                .success(true)
                .details(Map.of("jobId", application.getJobId(), "status", application.getStatus()))
                .build());

        return toResponse(application, job != null ? job.getTitle() : null);
    }

    public Page<JobApplicationResponse> findByApplicant(UUID applicantId, int page, int size,
                                                        String sortBy, String sortDir, HttpServletRequest httpRequest) {
        Pageable pageable = buildPageable(page, size, sortBy, sortDir);
        Page<JobApplication> applications = applicationRepository.findByApplicantId(applicantId, pageable);

        auditService.log(AuditLogParams.builder()
                .action(AuditLog.Action.JOB_READ)
                .userId(applicantId)
                .entityType("JobApplication")
                .request(httpRequest)
                .success(true)
                .details(Map.of("applicantId", applicantId, "resultCount", applications.getTotalElements()))
                .build());

        return applications.map(app -> toResponse(app, null));
    }

    public Page<JobApplicationResponse> findByJob(UUID jobId, String recruiterEmail, int page, int size,
                                                  String sortBy, String sortDir, HttpServletRequest httpRequest) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        if (!job.getPostedBy().equals(recruiterEmail)) {
            throw new IllegalArgumentException("Access denied: you can only view applications for your own jobs");
        }

        Pageable pageable = buildPageable(page, size, sortBy, sortDir);
        Page<JobApplication> applications = applicationRepository.findByJobId(jobId, pageable);

        auditService.log(AuditLogParams.builder()
                .action(AuditLog.Action.JOB_READ)
                .userEmail(recruiterEmail)
                .entityType("JobApplication")
                .entityId(jobId)
                .request(httpRequest)
                .success(true)
                .details(Map.of("jobId", jobId, "resultCount", applications.getTotalElements()))
                .build());

        return applications.map(app -> toResponse(app, job.getTitle()));
    }

    @Transactional
    @CacheEvict(value = "jobs", allEntries = true)
    public JobApplicationResponse updateStatus(UUID id, JobApplication.ApplicationStatus status,
                                               String recruiterEmail, HttpServletRequest httpRequest) {
        JobApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Application not found: " + id));

        Job job = jobRepository.findById(application.getJobId())
                .orElseThrow(() -> new IllegalArgumentException("Job not found"));

        if (!job.getPostedBy().equals(recruiterEmail)) {
            throw new IllegalArgumentException("Access denied: you can only update applications for your own jobs");
        }

        JobApplication.ApplicationStatus oldStatus = application.getStatus();
        application.setStatus(status);
        application = applicationRepository.save(application);

        auditService.log(AuditLogParams.builder()
                .action(AuditLog.Action.JOB_UPDATE)
                .userEmail(recruiterEmail)
                .entityType("JobApplication")
                .entityId(id)
                .request(httpRequest)
                .success(true)
                .details(Map.of("oldStatus", oldStatus.name(), "newStatus", status.name(), "jobId", job.getId()))
                .build());

        return toResponse(application, job.getTitle());
    }

    @Transactional
    public void delete(UUID id, UUID applicantId, HttpServletRequest httpRequest) {
        JobApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Application not found: " + id));

        if (!application.getApplicantId().equals(applicantId)) {
            throw new IllegalArgumentException("Access denied: you can only delete your own applications");
        }

        UUID jobId = application.getJobId();
        applicationRepository.deleteById(id);

        auditService.log(AuditLogParams.builder()
                .action(AuditLog.Action.JOB_DELETE)
                .userId(applicantId)
                .entityType("JobApplication")
                .entityId(id)
                .request(httpRequest)
                .success(true)
                .details(Map.of("jobId", jobId))
                .build());
    }

    @Cacheable(value = "jobs", key = "'jobAppCount:' + #jobId")
    public long countByJobId(UUID jobId, String userEmail, HttpServletRequest httpRequest) {
        auditService.log(AuditLogParams.builder()
                .action(AuditLog.Action.JOB_READ)
                .userEmail(userEmail)
                .entityType("JobApplication")
                .request(httpRequest)
                .success(true)
                .details(Map.of("action", "countByJobId", "jobId", jobId))
                .build());

        return applicationRepository.countByJobId(jobId);
    }

    private JobApplicationResponse toResponse(JobApplication entity, String jobTitle) {
        JobApplicationResponse response = applicationMapper.toResponseDTO(entity);
        response.setJobTitle(jobTitle);
        if (entity.getRemotePreference() != null) {
            response.setRemotePreference(entity.getRemotePreference().name());
        }
        return response;
    }

    private void createCandidateFromApplication(JobApplication application) {
        if (candidateRepository.existsByEmail(application.getEmail())) {
            return;
        }
        try {
            Candidate candidate = Candidate.builder()
                    .fullName(application.getFullName())
                    .email(application.getEmail())
                    .phone(application.getPhone())
                    .yearsOfExperience(application.getYearsOfExperience() != null
                            ? application.getYearsOfExperience() : 0)
                    .technicalSkills(application.getTechnicalSkills() != null
                            ? new java.util.ArrayList<>(application.getTechnicalSkills()) : List.of())
                    .location(application.getCurrentLocation())
                    .remotePreference(mapRemotePreference(application.getRemotePreference()))
                    .noticePeriod(application.getNoticePeriod())
                    .salaryExpectation(application.getSalaryExpectation() != null
                            ? application.getSalaryExpectation() : 0)
                    .currency(application.getCurrency() != null ? application.getCurrency() : "USD")
                    .resumeUrl(application.getResumeUrl())
                    .portfolioUrl(application.getPortfolioUrl())
                    .linkedinUrl(application.getLinkedinUrl())
                    .githubUrl(application.getGithubUrl())
                    .status(Candidate.CandidateStatus.NEW)
                    .build();
            candidateRepository.save(candidate);
        } catch (Exception e) {
            // Candidate creation must not fail the job application submission
            auditService.log(AuditLogParams.builder()
                    .action(AuditLog.Action.CANDIDATE_CREATE)
                    .userId(application.getApplicantId())
                    .entityType("JobApplication")
                    .entityId(application.getId())
                    .success(false)
                    .errorMessage("Failed to create candidate from application: " + e.getMessage())
                    .details(Map.of("jobId", application.getJobId(), "applicantId", application.getApplicantId()))
                    .build());
        }
    }

    private Candidate.RemotePreference mapRemotePreference(Job.RemoteWorkMode mode) {
        if (mode == null) {
            return Candidate.RemotePreference.ON_SITE;
        }
        try {
            return Candidate.RemotePreference.valueOf(mode.name());
        } catch (IllegalArgumentException e) {
            return Candidate.RemotePreference.ON_SITE;
        }
    }

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "appliedAt", "updatedAt", "fullName", "email", "status", "yearsOfExperience"
    );

    private Pageable buildPageable(int page, int size, String sortBy, String sortDir) {
        String safeSortBy = (sortBy != null && ALLOWED_SORT_FIELDS.contains(sortBy)) ? sortBy : "appliedAt";
        String safeSortDir = ("asc".equalsIgnoreCase(sortDir) || "desc".equalsIgnoreCase(sortDir)) ? sortDir : "desc";
        Sort sort = Sort.by(Sort.Direction.fromString(safeSortDir), safeSortBy);
        return PageRequest.of(page, size, sort);
    }
}
