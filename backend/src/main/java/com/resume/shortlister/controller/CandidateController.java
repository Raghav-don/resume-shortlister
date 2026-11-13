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
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/candidates")
@RequiredArgsConstructor
@Tag(name = "Candidates", description = "Candidate management endpoints")
public class CandidateController {

    private final CandidateService candidateService;

    @PostMapping
    @Operation(summary = "Submit a candidate (public endpoint)")
    public ResponseEntity<CandidateResponseDTO> create(
            @Valid @RequestBody CandidateRequestDTO request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(candidateService.create(request, "public", httpRequest));
    }

    @GetMapping
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    @Operation(summary = "List candidates with filters (recruiters only)")
    public ResponseEntity<Page<CandidateResponseDTO>> findAll(
            @ModelAttribute CandidateFilterDTO filter,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(candidateService.findWithFilters(filter, authentication.getName(), httpRequest));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    @Operation(summary = "Get candidate by ID")
    public ResponseEntity<CandidateResponseDTO> getById(
            @PathVariable UUID id,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(candidateService.getById(id, authentication.getName(), httpRequest));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    @Operation(summary = "Get all candidates by status")
    public ResponseEntity<List<CandidateResponseDTO>> getByStatus(
            @PathVariable Candidate.CandidateStatus status,
            Authentication authentication,
            HttpServletRequest httpRequest) {
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
        return ResponseEntity.ok(
                candidateService.updateStatus(id, status, recruiterNotes,
                        authentication.getName(), httpRequest));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete candidate (admin only)")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        candidateService.delete(id, authentication.getName(), httpRequest);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats/count-by-status")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    @Operation(summary = "Get candidate counts by status")
    public ResponseEntity<Map<Candidate.CandidateStatus, Long>> getStats(
            Authentication authentication,
            HttpServletRequest httpRequest) {
        Map<Candidate.CandidateStatus, Long> stats = new HashMap<>();
        for (Candidate.CandidateStatus status : Candidate.CandidateStatus.values()) {
            stats.put(status, candidateService.countByStatus(status, authentication.getName(), httpRequest));
        }
        return ResponseEntity.ok(stats);
    }
}
