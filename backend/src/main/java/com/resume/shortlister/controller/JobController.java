package com.resume.shortlister.controller;

import com.resume.shortlister.domain.Job;
import com.resume.shortlister.dto.JobFilterDTO;
import com.resume.shortlister.dto.JobRequestDTO;
import com.resume.shortlister.dto.JobResponseDTO;
import com.resume.shortlister.service.JobService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/jobs")
@RequiredArgsConstructor
@Tag(name = "Jobs", description = "Job posting and management endpoints")
public class JobController {

    private final JobService jobService;

    @PostMapping
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    @Operation(summary = "Post a new job role (recruiters only)")
    public ResponseEntity<JobResponseDTO> create(@Valid @RequestBody JobRequestDTO request,
                                                 Authentication authentication,
                                                 HttpServletRequest httpRequest) {
        return ResponseEntity.ok(jobService.create(request, authentication.getName(), httpRequest));
    }

    @GetMapping
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN') or hasRole('APPLICANT')")
    @Operation(summary = "List posted jobs with filters (all authenticated users)")
    public ResponseEntity<Page<JobResponseDTO>> findAll(@ModelAttribute JobFilterDTO filter,
                                                        Authentication authentication,
                                                        HttpServletRequest httpRequest) {
        Page<JobResponseDTO> jobs = jobService.findWithFilters(filter, authentication.getName(), httpRequest);
        return ResponseEntity.ok(jobs);
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN') or hasRole('APPLICANT')")
    @Operation(summary = "List jobs posted by the logged-in user")
    public ResponseEntity<List<JobResponseDTO>> findByPostedBy(Authentication authentication,
                                                               HttpServletRequest httpRequest) {
        return ResponseEntity.ok(
                jobService.findByPostedBy(authentication.getName(), authentication.getName(), httpRequest));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN') or hasRole('APPLICANT')")
    @Operation(summary = "Get job by ID")
    public ResponseEntity<JobResponseDTO> getById(@PathVariable UUID id,
                                                  Authentication authentication,
                                                  HttpServletRequest httpRequest) {
        return ResponseEntity.ok(jobService.getById(id, authentication.getName(), httpRequest));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    @Operation(summary = "Update a job role (recruiters only)")
    public ResponseEntity<JobResponseDTO> updateJob(
            @PathVariable UUID id,
            @Valid @RequestBody JobRequestDTO request,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(jobService.updateJob(id, request, authentication.getName(), httpRequest));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    @Operation(summary = "Update job status (DRAFT/ACTIVE/CLOSED/ARCHIVED)")
    public ResponseEntity<JobResponseDTO> updateStatus(
            @PathVariable UUID id,
            @RequestParam Job.JobStatus status,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(jobService.updateStatus(id, status, authentication.getName(), httpRequest));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete job (admin only)")
    public ResponseEntity<Void> delete(@PathVariable UUID id,
                                       Authentication authentication,
                                       HttpServletRequest httpRequest) {
        jobService.delete(id, authentication.getName(), httpRequest);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats/count-by-status")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    @Operation(summary = "Get job counts by status")
    public ResponseEntity<java.util.Map<Job.JobStatus, Long>> getStats(Authentication authentication,
                                                                       HttpServletRequest httpRequest) {
        java.util.Map<Job.JobStatus, Long> stats = new java.util.HashMap<>();
        for (Job.JobStatus jobStatus : Job.JobStatus.values()) {
            stats.put(jobStatus, jobService.countByStatus(jobStatus, authentication.getName(), httpRequest));
        }
        return ResponseEntity.ok(stats);
    }
}
