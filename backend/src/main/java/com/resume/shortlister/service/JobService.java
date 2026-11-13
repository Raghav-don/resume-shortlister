package com.resume.shortlister.service;

import com.resume.shortlister.audit.AuditLog;
import com.resume.shortlister.audit.AuditLogParams;
import com.resume.shortlister.audit.AuditService;
import com.resume.shortlister.domain.Job;
import com.resume.shortlister.dto.JobFilterDTO;
import com.resume.shortlister.dto.JobRequestDTO;
import com.resume.shortlister.dto.JobResponseDTO;
import com.resume.shortlister.mapper.JobMapper;
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

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class JobService {

    private final JobRepository jobRepository;
    private final JobMapper jobMapper;
    private final AuditService auditService;

    @Transactional
    @CacheEvict(value = "jobs", allEntries = true)
    public JobResponseDTO create(JobRequestDTO request, String postedBy, HttpServletRequest httpRequest) {
        if (jobRepository.existsByTitleAndPostedBy(request.getTitle(), postedBy)) {
            auditService.log(AuditLogParams.builder()
                    .action(AuditLog.Action.JOB_CREATE)
                    .userEmail(postedBy)
                    .entityType("Job")
                    .request(httpRequest)
                    .success(false)
                    .errorMessage("Job title already exists for this recruiter")
                    .details(Map.of("title", request.getTitle()))
                    .build());
            throw new IllegalArgumentException("Job with title '" + request.getTitle() + "' already exists");
        }

        Job job = jobMapper.toEntity(request);
        job.setPostedBy(postedBy);
        job = jobRepository.save(job);

        auditService.log(AuditLogParams.builder()
                .action(AuditLog.Action.JOB_CREATE)
                .userEmail(postedBy)
                .userId(job.getId())
                .entityType("Job")
                .entityId(job.getId())
                .request(httpRequest)
                .success(true)
                .details(Map.of("title", job.getTitle(), "status", job.getStatus()))
                .build());

        return jobMapper.toResponseDTO(job);
    }

    public JobResponseDTO getById(UUID id, String userEmail, HttpServletRequest httpRequest) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + id));

        auditService.log(AuditLogParams.builder()
                .action(AuditLog.Action.JOB_READ)
                .userEmail(userEmail)
                .entityType("Job")
                .entityId(id)
                .request(httpRequest)
                .success(true)
                .details(Map.of("title", job.getTitle()))
                .build());

        return jobMapper.toResponseDTO(job);
    }

    public Page<JobResponseDTO> findWithFilters(JobFilterDTO filter, String userEmail,
                                                HttpServletRequest httpRequest) {
        Pageable pageable = buildPageable(filter.getPage(), filter.getSize(), filter.getSortBy(),
                filter.getSortDir());
        Page<Job> jobs = jobRepository.findWithFilters(
                filter.getTitle(), filter.getStatus(), filter.getCandidateLevel(),
                filter.getEmploymentType(), filter.getWorkMode(), filter.getApplicationDeadline(),
                pageable
        );

        Map<String, Object> filtersMap = new HashMap<>();
        filtersMap.put("title", filter.getTitle());
        filtersMap.put("status", filter.getStatus() != null ? filter.getStatus().name() : null);
        filtersMap.put("candidateLevel", filter.getCandidateLevel() != null ? filter.getCandidateLevel().name() : null);
        filtersMap.put("employmentType", filter.getEmploymentType() != null ? filter.getEmploymentType().name() : null);
        filtersMap.put("workMode", filter.getWorkMode() != null ? filter.getWorkMode().name() : null);
        filtersMap.put("applicationDeadline",
                filter.getApplicationDeadline() != null ? filter.getApplicationDeadline().toString() : null);

        auditService.log(AuditLogParams.builder()
                .action(AuditLog.Action.JOB_READ)
                .userEmail(userEmail)
                .entityType("Job")
                .request(httpRequest)
                .success(true)
                .details(Map.of("resultCount", jobs.getTotalElements(), "filters", filtersMap))
                .build());

        return jobs.map(jobMapper::toResponseDTO);
    }

    public List<JobResponseDTO> findByPostedBy(String postedBy, String userEmail, HttpServletRequest httpRequest) {
        List<Job> jobs = jobRepository.findByPostedBy(postedBy);

        auditService.log(AuditLogParams.builder()
                .action(AuditLog.Action.JOB_READ)
                .userEmail(userEmail)
                .entityType("Job")
                .request(httpRequest)
                .success(true)
                .details(Map.of("postedBy", postedBy, "resultCount", jobs.size()))
                .build());

        return jobs.stream().map(jobMapper::toResponseDTO).toList();
    }

    @Transactional
    @CacheEvict(value = "jobs", allEntries = true)
    public JobResponseDTO updateStatus(UUID id, Job.JobStatus status,
                                       String updatedBy, HttpServletRequest httpRequest) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + id));

        Job.JobStatus oldStatus = job.getStatus();
        job.setStatus(status);
        job.setUpdatedBy(updatedBy);
        job = jobRepository.save(job);

        auditService.log(AuditLogParams.builder()
                .action(AuditLog.Action.JOB_UPDATE)
                .userEmail(updatedBy)
                .userId(id)
                .entityType("Job")
                .entityId(id)
                .request(httpRequest)
                .success(true)
                .details(Map.of("oldStatus", oldStatus.name(), "newStatus", status.name()))
                .build());

        return jobMapper.toResponseDTO(job);
    }

    @Transactional
    @CacheEvict(value = "jobs", allEntries = true)
    public JobResponseDTO updateJob(UUID id, JobRequestDTO request, String updatedBy, HttpServletRequest httpRequest) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + id));

        job.setTitle(request.getTitle());
        job.setJobDescription(request.getJobDescription());
        job.setEligibilityCriteria(request.getEligibilityCriteria());
        job.setPreferredTechnicalSkills(request.getPreferredTechnicalSkills());
        job.setEmploymentType(request.getEmploymentType());
        job.setWorkMode(request.getWorkMode());
        job.setOfficeLocation(request.getOfficeLocation());
        job.setCandidateLevel(request.getCandidateLevel());
        job.setMinExperienceYears(request.getMinExperienceYears());
        job.setMinExperienceMonths(request.getMinExperienceMonths());
        job.setMaxExperienceYears(request.getMaxExperienceYears());
        job.setMaxExperienceMonths(request.getMaxExperienceMonths());
        job.setEducationRequirement(request.getEducationRequirement());
        job.setDepartment(request.getDepartment());
        job.setPerksAndBenefits(request.getPerksAndBenefits());
        job.setHiringProcess(request.getHiringProcess());
        job.setSalaryMin(request.getSalaryMin());
        job.setSalaryMax(request.getSalaryMax());
        job.setSalaryCurrency(request.getSalaryCurrency());
        job.setSalaryPeriod(request.getSalaryPeriod());
        job.setHideSalary(request.getHideSalary());
        job.setApplicationDeadline(request.getApplicationDeadline());
        job.setContactEmail(request.getContactEmail());
        job.setApplicationUrl(request.getApplicationUrl());
        job.setUpdatedBy(updatedBy);
        job = jobRepository.save(job);

        auditService.log(AuditLogParams.builder()
                .action(AuditLog.Action.JOB_UPDATE)
                .userEmail(updatedBy)
                .userId(id)
                .entityType("Job")
                .entityId(id)
                .request(httpRequest)
                .success(true)
                .details(Map.of("title", job.getTitle(), "status", job.getStatus()))
                .build());

        return jobMapper.toResponseDTO(job);
    }

    @Transactional
    @CacheEvict(value = "jobs", allEntries = true)
    public void delete(UUID id, String deletedBy, HttpServletRequest httpRequest) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + id));

        String title = job.getTitle();
        jobRepository.deleteById(id);

        auditService.log(AuditLogParams.builder()
                .action(AuditLog.Action.JOB_DELETE)
                .userEmail(deletedBy)
                .userId(id)
                .entityType("Job")
                .entityId(id)
                .request(httpRequest)
                .success(true)
                .details(Map.of("title", title))
                .build());
    }

    @Cacheable(value = "jobs", key = "'countByStatus:' + #status")
    public long countByStatus(Job.JobStatus status, String userEmail, HttpServletRequest httpRequest) {
        auditService.log(AuditLogParams.builder()
                .action(AuditLog.Action.JOB_READ)
                .userEmail(userEmail)
                .entityType("Job")
                .request(httpRequest)
                .success(true)
                .details(Map.of("action", "countByStatus", "status", status.name()))
                .build());

        return jobRepository.countByStatus(status);
    }

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "createdAt", "updatedAt", "title", "status", "applicationDeadline"
    );

    private Pageable buildPageable(int page, int size, String sortBy, String sortDir) {
        String safeSortBy = (sortBy != null && ALLOWED_SORT_FIELDS.contains(sortBy)) ? sortBy : "createdAt";
        String safeSortDir = ("asc".equalsIgnoreCase(sortDir) || "desc".equalsIgnoreCase(sortDir)) ? sortDir : "desc";
        Sort sort = Sort.by(Sort.Direction.fromString(safeSortDir), safeSortBy);
        return PageRequest.of(page, size, sort);
    }
}
