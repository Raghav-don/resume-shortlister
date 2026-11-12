package com.resume.shortlister.controller;

import com.resume.shortlister.domain.Job;
import com.resume.shortlister.dto.JobRequestDTO;
import com.resume.shortlister.dto.JobResponseDTO;
import com.resume.shortlister.service.JobService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
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
    public ResponseEntity<Page<JobResponseDTO>> findAll(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) Job.JobStatus status,
            @RequestParam(required = false) Job.CandidateLevel candidateLevel,
            @RequestParam(required = false) Job.EmploymentType employmentType,
            @RequestParam(required = false) Job.RemoteWorkMode workMode,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate applicationDeadline,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        Page<JobResponseDTO> jobs = jobService.findWithFilters(
                title, status, candidateLevel, employmentType, workMode, applicationDeadline,
                page, size, sortBy, sortDir, authentication.getName(), httpRequest
        );
        return ResponseEntity.ok(jobs);
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN') or hasRole('APPLICANT')")
    @Operation(summary = "List jobs posted by the logged-in user")
    public ResponseEntity<List<JobResponseDTO>> findByPostedBy(Authentication authentication,
                                                               HttpServletRequest httpRequest) {
        return ResponseEntity.ok(jobService.findByPostedBy(authentication.getName(), authentication.getName(), httpRequest));
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
