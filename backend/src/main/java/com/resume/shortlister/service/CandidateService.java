package com.resume.shortlister.service;

import com.resume.shortlister.audit.AuditLog;
import com.resume.shortlister.audit.AuditLogParams;
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
import java.util.Set;
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
            auditService.log(AuditLogParams.builder()
                    .action(AuditLog.Action.CANDIDATE_CREATE)
                    .userEmail(createdBy)
                    .entityType("Candidate")
                    .request(httpRequest)
                    .success(false)
                    .errorMessage("Email already exists")
                    .details(Map.of("email", request.getEmail()))
                    .build());
            throw new IllegalArgumentException("Candidate with email " + request.getEmail() + " already exists");
        }
        Candidate candidate = candidateMapper.toEntity(request);
        candidate.setCreatedBy(createdBy);
        candidate = candidateRepository.save(candidate);

        auditService.log(AuditLogParams.builder()
                .action(AuditLog.Action.CANDIDATE_CREATE)
                .userEmail(createdBy)
                .entityType("Candidate")
                .entityId(candidate.getId())
                .request(httpRequest)
                .success(true)
                .details(Map.of("email", candidate.getEmail(), "name", candidate.getFullName()))
                .build());

        return candidateMapper.toResponseDTO(candidate);
    }

    public CandidateResponseDTO getById(UUID id, String userEmail, HttpServletRequest httpRequest) {
        Candidate candidate = candidateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Candidate not found: " + id));

        auditService.log(AuditLogParams.builder()
                .action(AuditLog.Action.CANDIDATE_READ)
                .userEmail(userEmail)
                .entityType("Candidate")
                .entityId(id)
                .request(httpRequest)
                .success(true)
                .details(Map.of("email", candidate.getEmail()))
                .build());

        return candidateMapper.toResponseDTO(candidate);
    }

    public Page<CandidateResponseDTO> findWithFilters(CandidateFilterDTO filter,
                                                      String userEmail,
                                                      HttpServletRequest httpRequest) {
        Pageable pageable = buildPageable(filter);
        Page<Candidate> candidates = candidateRepository.findWithFilters(filter, pageable);

        auditService.log(AuditLogParams.builder()
                .action(AuditLog.Action.CANDIDATE_READ)
                .userEmail(userEmail)
                .entityType("Candidate")
                .request(httpRequest)
                .success(true)
                .details(Map.of("filters", filter, "resultCount", candidates.getTotalElements()))
                .build());

        return candidates.map(candidateMapper::toResponseDTO);
    }

    public List<CandidateResponseDTO> getAllByStatus(Candidate.CandidateStatus status,
                                                     String userEmail,
                                                     HttpServletRequest httpRequest) {
        auditService.log(AuditLogParams.builder()
                .action(AuditLog.Action.CANDIDATE_READ)
                .userEmail(userEmail)
                .entityType("Candidate")
                .request(httpRequest)
                .success(true)
                .details(Map.of("status", status.name()))
                .build());

        return candidateRepository.findByStatus(status).stream()
                .map(candidateMapper::toResponseDTO)
                .toList();
    }

    @Transactional
    @CacheEvict(value = "stats", allEntries = true)
    public CandidateResponseDTO updateStatus(UUID id, Candidate.CandidateStatus status,
                                             String recruiterNotes, String updatedBy,
                                             HttpServletRequest httpRequest) {
        Candidate candidate = candidateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Candidate not found: " + id));

        Candidate.CandidateStatus oldStatus = candidate.getStatus();
        candidate.setStatus(status);
        if (recruiterNotes != null) {
            candidate.setRecruiterNotes(recruiterNotes);
        }
        candidate.setUpdatedBy(updatedBy);
        candidate = candidateRepository.save(candidate);

        auditService.log(AuditLogParams.builder()
                .action(AuditLog.Action.CANDIDATE_STATUS_CHANGE)
                .userEmail(updatedBy)
                .entityType("Candidate")
                .entityId(id)
                .request(httpRequest)
                .success(true)
                .details(Map.of("oldStatus", oldStatus.name(), "newStatus", status.name(), "notes", recruiterNotes))
                .build());

        return candidateMapper.toResponseDTO(candidate);
    }

    @Transactional
    @CacheEvict(value = "stats", allEntries = true)
    public void delete(UUID id, String deletedBy, HttpServletRequest httpRequest) {
        Candidate candidate = candidateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Candidate not found: " + id));

        String email = candidate.getEmail();
        candidateRepository.deleteById(id);

        auditService.log(AuditLogParams.builder()
                .action(AuditLog.Action.CANDIDATE_DELETE)
                .userEmail(deletedBy)
                .entityType("Candidate")
                .entityId(id)
                .request(httpRequest)
                .success(true)
                .details(Map.of("email", email))
                .build());
    }

    @Cacheable(value = "stats", key = "'countByStatus:' + #status")
    public long countByStatus(Candidate.CandidateStatus status, String userEmail, HttpServletRequest httpRequest) {
        auditService.log(AuditLogParams.builder()
                .action(AuditLog.Action.CANDIDATE_READ)
                .userEmail(userEmail)
                .entityType("Candidate")
                .request(httpRequest)
                .success(true)
                .details(Map.of("action", "countByStatus", "status", status.name()))
                .build());

        return candidateRepository.countByStatus(status);
    }

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "createdAt", "updatedAt", "fullName", "email", "yearsOfExperience",
            "salaryExpectation", "location", "status", "remotePreference"
    );

    private Pageable buildPageable(CandidateFilterDTO filter) {
        String sortBy = filter.getSortBy();
        if (sortBy == null || !ALLOWED_SORT_FIELDS.contains(sortBy)) {
            sortBy = "createdAt";
        }
        String sortDir = filter.getSortDir();
        if (!"asc".equalsIgnoreCase(sortDir) && !"desc".equalsIgnoreCase(sortDir)) {
            sortDir = "desc";
        }
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        return PageRequest.of(filter.getPage(), filter.getSize(), sort);
    }
}