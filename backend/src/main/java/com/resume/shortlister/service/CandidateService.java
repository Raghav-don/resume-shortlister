package com.resume.shortlister.service;

import com.resume.shortlister.audit.AuditLog;
import com.resume.shortlister.audit.AuditService;
import com.resume.shortlister.domain.Candidate;
import com.resume.shortlister.dto.CandidateFilterDTO;
import com.resume.shortlister.dto.CandidateRequestDTO;
import com.resume.shortlister.dto.CandidateResponseDTO;
import com.resume.shortlister.mapper.CandidateMapper;
import com.resume.shortlister.repository.CandidateRepository;
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
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CandidateService {

    private final CandidateRepository candidateRepository;
    private final CandidateMapper candidateMapper;
    private final AuditService auditService;

    @Transactional
    @CacheEvict(value = "stats", allEntries = true)
    public CandidateResponseDTO create(CandidateRequestDTO request, String createdBy, HttpServletRequest httpRequest) {
        if (candidateRepository.existsByEmail(request.getEmail())) {
            auditService.log(AuditLog.Action.CANDIDATE_CREATE, createdBy, null, "Candidate",
                    null, httpRequest, false, "Email already exists",
                    Map.of("email", request.getEmail()));
            throw new IllegalArgumentException("Candidate with email " + request.getEmail() + " already exists");
        }
        Candidate candidate = candidateMapper.toEntity(request);
        candidate.setCreatedBy(createdBy);
        candidate = candidateRepository.save(candidate);

        auditService.log(AuditLog.Action.CANDIDATE_CREATE, createdBy, null, "Candidate",
                candidate.getId(), httpRequest, true, null,
                Map.of("email", candidate.getEmail(), "name", candidate.getFullName()));

        return candidateMapper.toResponseDTO(candidate);
    }

    public CandidateResponseDTO getById(UUID id, String userEmail, HttpServletRequest httpRequest) {
        Candidate candidate = candidateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Candidate not found: " + id));

        auditService.log(AuditLog.Action.CANDIDATE_READ, userEmail, null, "Candidate",
                id, httpRequest, true, null,
                Map.of("email", candidate.getEmail()));

        return candidateMapper.toResponseDTO(candidate);
    }

    public Page<CandidateResponseDTO> findWithFilters(CandidateFilterDTO filter, String userEmail, HttpServletRequest httpRequest) {
        Pageable pageable = buildPageable(filter);
        Page<Candidate> candidates = candidateRepository.findWithFilters(
                filter.getMinExperience(),
                filter.getMaxExperience(),
                filter.getSkills(),
                filter.getSkillList(),
                filter.getLocation(),
                filter.getRemotePreference(),
                filter.getNoticePeriod(),
                filter.getMaxSalary(),
                filter.getStatus(),
                pageable
        );

        auditService.log(AuditLog.Action.CANDIDATE_READ, userEmail, null, "Candidate",
                null, httpRequest, true, null,
                Map.of("filters", filter, "resultCount", candidates.getTotalElements()));

        return candidates.map(candidateMapper::toResponseDTO);
    }

    public List<CandidateResponseDTO> getAllByStatus(Candidate.CandidateStatus status, String userEmail, HttpServletRequest httpRequest) {
        auditService.log(AuditLog.Action.CANDIDATE_READ, userEmail, null, "Candidate",
                null, httpRequest, true, null,
                Map.of("status", status.name()));

        return candidateRepository.findByStatus(status).stream()
                .map(candidateMapper::toResponseDTO)
                .toList();
    }

    @Transactional
    @CacheEvict(value = "stats", allEntries = true)
    public CandidateResponseDTO updateStatus(UUID id, Candidate.CandidateStatus status, String recruiterNotes, String updatedBy, HttpServletRequest httpRequest) {
        Candidate candidate = candidateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Candidate not found: " + id));

        Candidate.CandidateStatus oldStatus = candidate.getStatus();
        candidate.setStatus(status);
        if (recruiterNotes != null) {
            candidate.setRecruiterNotes(recruiterNotes);
        }
        candidate.setUpdatedBy(updatedBy);
        candidate = candidateRepository.save(candidate);

        auditService.log(AuditLog.Action.CANDIDATE_STATUS_CHANGE, updatedBy, null, "Candidate",
                id, httpRequest, true, null,
                Map.of("oldStatus", oldStatus.name(), "newStatus", status.name(), "notes", recruiterNotes));

        return candidateMapper.toResponseDTO(candidate);
    }

    @Transactional
    @CacheEvict(value = "stats", allEntries = true)
    public void delete(UUID id, String deletedBy, HttpServletRequest httpRequest) {
        Candidate candidate = candidateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Candidate not found: " + id));

        String email = candidate.getEmail();
        candidateRepository.deleteById(id);

        auditService.log(AuditLog.Action.CANDIDATE_DELETE, deletedBy, null, "Candidate",
                id, httpRequest, true, null,
                Map.of("email", email));
    }

    @Cacheable(value = "stats", key = "'countByStatus:' + #status")
    public long countByStatus(Candidate.CandidateStatus status, String userEmail, HttpServletRequest httpRequest) {
        auditService.log(AuditLog.Action.CANDIDATE_READ, userEmail, null, "Candidate",
                null, httpRequest, true, null,
                Map.of("action", "countByStatus", "status", status.name()));

        return candidateRepository.countByStatus(status);
    }

    private Pageable buildPageable(CandidateFilterDTO filter) {
        Sort sort = Sort.by(Sort.Direction.fromString(filter.getSortDir()), filter.getSortBy());
        return PageRequest.of(filter.getPage(), filter.getSize(), sort);
    }
}