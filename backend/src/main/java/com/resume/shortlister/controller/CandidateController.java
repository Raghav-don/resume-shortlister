package com.resume.shortlister.controller;

import com.resume.shortlister.domain.Candidate;
import com.resume.shortlister.dto.CandidateFilterDTO;
import com.resume.shortlister.dto.CandidateRequestDTO;
import com.resume.shortlister.dto.CandidateResponseDTO;
import com.resume.shortlister.service.CandidateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/candidates")
@RequiredArgsConstructor
@Tag(name = "Candidates", description = "Candidate management endpoints")
public class CandidateController {

    private final CandidateService candidateService;

    @PostMapping
    @Operation(summary = "Submit a candidate (public endpoint)")
    public ResponseEntity<CandidateResponseDTO> create(@Valid @RequestBody CandidateRequestDTO request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(candidateService.create(request, "public", httpRequest));
    }

    @GetMapping
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    @Operation(summary = "List candidates with filters (recruiters only)")
    public ResponseEntity<Page<CandidateResponseDTO>> findAll(
            @RequestParam(required = false) Integer minExperience,
            @RequestParam(required = false) Integer maxExperience,
            @RequestParam(required = false) String skills,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Candidate.RemotePreference remotePreference,
            @RequestParam(required = false) String noticePeriod,
            @RequestParam(required = false) Integer maxSalary,
            @RequestParam(required = false) Candidate.CandidateStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        CandidateFilterDTO filter = CandidateFilterDTO.builder()
                .minExperience(minExperience)
                .maxExperience(maxExperience)
                .skills(skills)
                .location(location)
                .remotePreference(remotePreference)
                .noticePeriod(noticePeriod)
                .maxSalary(maxSalary)
                .status(status)
                .page(page)
                .size(size)
                .sortBy(sortBy)
                .sortDir(sortDir)
                .build();

        return ResponseEntity.ok(candidateService.findWithFilters(filter, authentication.getName(), httpRequest));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    @Operation(summary = "Get candidate by ID")
    public ResponseEntity<CandidateResponseDTO> getById(@PathVariable UUID id, Authentication authentication, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(candidateService.getById(id, authentication.getName(), httpRequest));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    @Operation(summary = "Get all candidates by status")
    public ResponseEntity<List<CandidateResponseDTO>> getByStatus(@PathVariable Candidate.CandidateStatus status, Authentication authentication, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(candidateService.getAllByStatus(status, authentication.getName(), httpRequest));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    @Operation(summary = "Update candidate status")
    public ResponseEntity<CandidateResponseDTO> updateStatus(
            @PathVariable UUID id,
            @RequestParam Candidate.CandidateStatus status,
            @RequestParam(required = false) String recruiterNotes,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(candidateService.updateStatus(id, status, recruiterNotes, authentication.getName(), httpRequest));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete candidate (admin only)")
    public ResponseEntity<Void> delete(@PathVariable UUID id, Authentication authentication, HttpServletRequest httpRequest) {
        candidateService.delete(id, authentication.getName(), httpRequest);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats/count-by-status")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    @Operation(summary = "Get candidate counts by status")
    public ResponseEntity<java.util.Map<Candidate.CandidateStatus, Long>> getStats(Authentication authentication, HttpServletRequest httpRequest) {
        java.util.Map<Candidate.CandidateStatus, Long> stats = new java.util.HashMap<>();
        for (Candidate.CandidateStatus status : Candidate.CandidateStatus.values()) {
            stats.put(status, candidateService.countByStatus(status, authentication.getName(), httpRequest));
        }
        return ResponseEntity.ok(stats);
    }
}