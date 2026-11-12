package com.resume.shortlister.controller;

import com.resume.shortlister.domain.JobApplication;
import com.resume.shortlister.dto.JobApplicationRequest;
import com.resume.shortlister.dto.JobApplicationResponse;
import com.resume.shortlister.repository.RecruiterRepository;
import com.resume.shortlister.service.JobApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@RestController
@RequestMapping("/job-applications")
@RequiredArgsConstructor
@Tag(name = "Job Applications", description = "Job application submission and management")
public class JobApplicationController {

    private final JobApplicationService jobApplicationService;
    private final RecruiterRepository recruiterRepository;

    @Value("${app.uploads.resume-dir:./uploads/resumes}")
    private String resumeUploadDir;

    private UUID getApplicantId(Authentication authentication) {
        String email = authentication.getName();
        return recruiterRepository.findByEmail(email)
                .map(com.resume.shortlister.domain.Recruiter::getId)
                .orElseThrow(() -> new IllegalArgumentException("Applicant not found: " + email));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('APPLICANT')")
    @Operation(summary = "Apply to a job (applicants only)")
    public ResponseEntity<JobApplicationResponse> apply(
            @Parameter(description = "Application data as JSON") @RequestPart("request") @Valid JobApplicationRequest request,
            @Parameter(description = "Resume file (PDF or DOCX)") @RequestPart(value = "resume", required = false) MultipartFile resume,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        if (resume != null && !resume.isEmpty()) {
            String stored = storeResume(resume);
            request.setResumeUrl("/api/job-applications/resumes/" + stored);
            request.setResumeFileName(StringUtils.cleanPath(resume.getOriginalFilename()));
        }
        UUID applicantId = getApplicantId(authentication);
        return ResponseEntity.ok(jobApplicationService.apply(request, applicantId, httpRequest));
    }

    @GetMapping("/resumes/{filename:.+}")
    @Operation(summary = "Serve an uploaded resume file")
    public ResponseEntity<Resource> getResume(@PathVariable String filename) throws MalformedURLException {
        Path file = Paths.get(resumeUploadDir).resolve(StringUtils.cleanPath(filename)).normalize();
        Resource resource = new UrlResource(file.toUri());
        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }
        String contentType = "application/octet-stream";
        try {
            contentType = Files.probeContentType(file);
        } catch (IOException ignored) {
        }
        if (contentType == null) {
            contentType = "application/octet-stream";
        }
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    private String storeResume(MultipartFile resume) throws IllegalArgumentException {
        String originalFilename = StringUtils.cleanPath(resume.getOriginalFilename());
        if (originalFilename == null || originalFilename.isEmpty()) {
            throw new IllegalArgumentException("Invalid resume file name");
        }
        String extension = "";
        int dot = originalFilename.lastIndexOf('.');
        if (dot > 0 && dot < originalFilename.length() - 1) {
            extension = originalFilename.substring(dot).toLowerCase();
        }
        if (!".pdf".equals(extension) && !".docx".equals(extension)) {
            throw new IllegalArgumentException("Only PDF and DOCX resume files are allowed");
        }
        try {
            Path dir = Paths.get(resumeUploadDir);
            if (!Files.exists(dir)) {
                Files.createDirectories(dir);
            }
            String storedName = UUID.randomUUID().toString() + extension;
            Path target = dir.resolve(storedName);
            Files.copy(resume.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return storedName;
        } catch (IOException e) {
            throw new IllegalArgumentException("Failed to store resume file: " + e.getMessage());
        }
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('APPLICANT')")
    @Operation(summary = "List my job applications (applicant only)")
    public ResponseEntity<Page<JobApplicationResponse>> findMyApplications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "appliedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        UUID applicantId = getApplicantId(authentication);
        Page<JobApplicationResponse> applications = jobApplicationService.findByApplicant(
                applicantId, page, size, sortBy, sortDir, httpRequest
        );
        return ResponseEntity.ok(applications);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get application by ID")
    public ResponseEntity<JobApplicationResponse> getById(@PathVariable UUID id,
                                                          Authentication authentication,
                                                          HttpServletRequest httpRequest) {
        String email = authentication.getName();
        boolean isRecruiter = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_RECRUITER") || a.getAuthority().equals("ROLE_ADMIN"));
        UUID applicantId = isRecruiter ? null : getApplicantId(authentication);
        return ResponseEntity.ok(jobApplicationService.getById(id, applicantId, isRecruiter, httpRequest));
    }

    @GetMapping("/job/{jobId}")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    @Operation(summary = "List applications for a job (recruiter only)")
    public ResponseEntity<Page<JobApplicationResponse>> findByJob(
            @PathVariable UUID jobId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "appliedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        Page<JobApplicationResponse> applications = jobApplicationService.findByJob(
                jobId, authentication.getName(), page, size, sortBy, sortDir, httpRequest
        );
        return ResponseEntity.ok(applications);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    @Operation(summary = "Update application status (recruiter only)")
    public ResponseEntity<JobApplicationResponse> updateStatus(
            @PathVariable UUID id,
            @RequestParam JobApplication.ApplicationStatus status,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(jobApplicationService.updateStatus(id, status, authentication.getName(), httpRequest));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Withdraw my application (applicant only)")
    public ResponseEntity<Void> withdraw(@PathVariable UUID id,
                                         Authentication authentication,
                                         HttpServletRequest httpRequest) {
        UUID applicantId = getApplicantId(authentication);
        jobApplicationService.delete(id, applicantId, httpRequest);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/job/{jobId}/count")
    @Operation(summary = "Get application count for a job")
    public ResponseEntity<Long> countByJob(@PathVariable UUID jobId,
                                           Authentication authentication,
                                           HttpServletRequest httpRequest) {
        long count = jobApplicationService.countByJobId(jobId, authentication.getName(), httpRequest);
        return ResponseEntity.ok(count);
    }
}
