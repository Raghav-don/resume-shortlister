package com.resume.shortlister.service;

import com.resume.shortlister.audit.AuditLog;
import com.resume.shortlister.audit.AuditService;
import com.resume.shortlister.domain.Job;
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

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
            auditService.log(AuditLog.Action.JOB_CREATE, postedBy, null, "Job",
                    null, httpRequest, false, "Job title already exists for this recruiter",
                    Map.of("title", request.getTitle()));
            throw new IllegalArgumentException("Job with title '" + request.getTitle() + "' already exists");
        }

        Job job = jobMapper.toEntity(request);
        job.setPostedBy(postedBy);
        job = jobRepository.save(job);

        auditService.log(AuditLog.Action.JOB_CREATE, postedBy, job.getId(), "Job",
                job.getId(), httpRequest, true, null,
                Map.of("title", job.getTitle(), "status", job.getStatus()));

        return jobMapper.toResponseDTO(job);
    }

    public JobResponseDTO getById(UUID id, String userEmail, HttpServletRequest httpRequest) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + id));

        auditService.log(AuditLog.Action.JOB_READ, userEmail, null, "Job",
                id, httpRequest, true, null,
                Map.of("title", job.getTitle()));

        return jobMapper.toResponseDTO(job);
    }

    public Page<JobResponseDTO> findWithFilters(String title, Job.JobStatus status, Job.CandidateLevel candidateLevel,
                                                Job.EmploymentType employmentType, Job.RemoteWorkMode workMode,
                                                LocalDate applicationDeadline,
                                                int page, int size, String sortBy, String sortDir,
                                                String userEmail, HttpServletRequest httpRequest) {
        Pageable pageable = buildPageable(page, size, sortBy, sortDir);
        Page<Job> jobs = jobRepository.findWithFilters(
                title, status, candidateLevel, employmentType, workMode, applicationDeadline, pageable
        );

        Map<String, Object> filtersMap = new HashMap<>();
        filtersMap.put("title", title);
        filtersMap.put("status", status != null ? status.name() : null);
        filtersMap.put("candidateLevel", candidateLevel != null ? candidateLevel.name() : null);
        filtersMap.put("employmentType", employmentType != null ? employmentType.name() : null);
        filtersMap.put("workMode", workMode != null ? workMode.name() : null);
        filtersMap.put("applicationDeadline", applicationDeadline != null ? applicationDeadline.toString() : null);

        auditService.log(AuditLog.Action.JOB_READ, userEmail, null, "Job",
                null, httpRequest, true, null,
                Map.of("resultCount", jobs.getTotalElements(), "filters", filtersMap));

        return jobs.map(jobMapper::toResponseDTO);
    }

    public List<JobResponseDTO> findByPostedBy(String postedBy, String userEmail, HttpServletRequest httpRequest) {
        List<Job> jobs = jobRepository.findByPostedBy(postedBy);

        auditService.log(AuditLog.Action.JOB_READ, userEmail, null, "Job",
                null, httpRequest, true, null,
                Map.of("postedBy", postedBy, "resultCount", jobs.size()));

        return jobs.stream().map(jobMapper::toResponseDTO).toList();
    }

    @Transactional
    @CacheEvict(value = "jobs", allEntries = true)
    public JobResponseDTO updateStatus(UUID id, Job.JobStatus status, String updatedBy, HttpServletRequest httpRequest) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + id));

        Job.JobStatus oldStatus = job.getStatus();
        job.setStatus(status);
        job.setUpdatedBy(updatedBy);
        job = jobRepository.save(job);

        auditService.log(AuditLog.Action.JOB_UPDATE, updatedBy, id, "Job",
                id, httpRequest, true, null,
                Map.of("oldStatus", oldStatus.name(), "newStatus", status.name()));

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

        auditService.log(AuditLog.Action.JOB_UPDATE, updatedBy, id, "Job",
                id, httpRequest, true, null,
                Map.of("title", job.getTitle(), "status", job.getStatus()));

        return jobMapper.toResponseDTO(job);
    }

    @Transactional
    @CacheEvict(value = "jobs", allEntries = true)
    public void delete(UUID id, String deletedBy, HttpServletRequest httpRequest) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + id));

        String title = job.getTitle();
        jobRepository.deleteById(id);

        auditService.log(AuditLog.Action.JOB_DELETE, deletedBy, id, "Job",
                id, httpRequest, true, null,
                Map.of("title", title));
    }

    @Cacheable(value = "jobs", key = "'countByStatus:' + #status")
    public long countByStatus(Job.JobStatus status, String userEmail, HttpServletRequest httpRequest) {
        auditService.log(AuditLog.Action.JOB_READ, userEmail, null, "Job",
                null, httpRequest, true, null,
                Map.of("action", "countByStatus", "status", status.name()));

        return jobRepository.countByStatus(status);
    }

    private Pageable buildPageable(int page, int size, String sortBy, String sortDir) {
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        return PageRequest.of(page, size, sort);
    }
}
