package com.resume.shortlister.service;

import com.resume.shortlister.audit.AuditLogParams;
import com.resume.shortlister.audit.AuditService;
import com.resume.shortlister.domain.Candidate;
import com.resume.shortlister.dto.CandidateFilterDTO;
import com.resume.shortlister.dto.CandidateRequestDTO;
import com.resume.shortlister.dto.CandidateResponseDTO;
import com.resume.shortlister.mapper.CandidateMapper;
import com.resume.shortlister.repository.CandidateRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mapstruct.factory.Mappers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CandidateServiceTest {

    @Mock
    private CandidateRepository candidateRepository;

    @Mock
    private AuditService auditService;

    @Mock
    private HttpServletRequest httpRequest;

    private CandidateMapper candidateMapper;
    private CandidateService candidateService;

    @BeforeEach
    void setUp() {
        candidateMapper = Mappers.getMapper(CandidateMapper.class);
        candidateService = new CandidateService(candidateRepository, candidateMapper, auditService);
        lenient().when(httpRequest.getHeader("X-Forwarded-For")).thenReturn(null);
        lenient().when(httpRequest.getHeader("X-Real-IP")).thenReturn(null);
        lenient().when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");
        lenient().when(httpRequest.getHeader("User-Agent")).thenReturn("Test Agent");
    }

    @Test
    void shouldCreateCandidateSuccessfully() {
        CandidateRequestDTO request = createValidRequest();
        Candidate savedCandidate = createCandidateEntity();
        savedCandidate.setId(UUID.randomUUID());

        when(candidateRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(candidateRepository.save(any(Candidate.class))).thenReturn(savedCandidate);

        CandidateResponseDTO response = candidateService.create(request, "public", httpRequest);

        assertThat(response).isNotNull();
        assertThat(response.getEmail()).isEqualTo(request.getEmail());
        assertThat(response.getFullName()).isEqualTo(request.getFullName());
        assertThat(response.getStatus()).isEqualTo(Candidate.CandidateStatus.NEW);
        verify(candidateRepository).save(any(Candidate.class));
        verify(auditService).log(any(AuditLogParams.class));
    }

    @Test
    void shouldThrowExceptionWhenEmailExists() {
        CandidateRequestDTO request = createValidRequest();

        when(candidateRepository.existsByEmail(request.getEmail())).thenReturn(true);

        assertThatThrownBy(() -> candidateService.create(request, "public", httpRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already exists");

        verify(candidateRepository, never()).save(any());
        verify(auditService).log(any(AuditLogParams.class));
    }

    @Test
    void shouldGetCandidateById() {
        UUID id = UUID.randomUUID();
        Candidate candidate = createCandidateEntity();
        candidate.setId(id);

        when(candidateRepository.findById(id)).thenReturn(Optional.of(candidate));

        CandidateResponseDTO response = candidateService.getById(id, "recruiter@example.com", httpRequest);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(id);
        verify(auditService).log(any(AuditLogParams.class));
    }

    @Test
    void shouldThrowExceptionWhenCandidateNotFound() {
        UUID id = UUID.randomUUID();

        when(candidateRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> candidateService.getById(id, "recruiter@example.com", httpRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not found");
    }

    @Test
    void shouldFindCandidatesWithFilters() {
        Candidate candidate = createCandidateEntity();
        candidate.setId(UUID.randomUUID());

        Page<Candidate> page = new PageImpl<>(List.of(candidate), PageRequest.of(0, 20), 1);
        when(candidateRepository.findWithFilters(any(CandidateFilterDTO.class), any(Pageable.class)))
                .thenReturn(page);

        CandidateFilterDTO filter = CandidateFilterDTO.builder()
                .minExperience(3)
                .maxExperience(10)
                .skills("React")
                .location("San Francisco")
                .remotePreference(Candidate.RemotePreference.REMOTE)
                .noticePeriod("30 days")
                .maxSalary(200000)
                .status(Candidate.CandidateStatus.NEW)
                .page(0)
                .size(20)
                .sortBy("createdAt")
                .sortDir("desc")
                .build();

        Page<CandidateResponseDTO> response = candidateService.findWithFilters(filter, "recruiter@example.com", httpRequest);

        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getTotalElements()).isEqualTo(1);
        verify(auditService).log(any(AuditLogParams.class));
    }

    @Test
    void shouldUpdateCandidateStatus() {
        UUID id = UUID.randomUUID();
        Candidate candidate = createCandidateEntity();
        candidate.setId(id);
        candidate.setStatus(Candidate.CandidateStatus.NEW);

        when(candidateRepository.findById(id)).thenReturn(Optional.of(candidate));
        when(candidateRepository.save(any(Candidate.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CandidateResponseDTO response = candidateService.updateStatus(
                id, Candidate.CandidateStatus.SHORTLISTED, "Great candidate", "recruiter@example.com", httpRequest);

        assertThat(response.getStatus()).isEqualTo(Candidate.CandidateStatus.SHORTLISTED);
        assertThat(response.getRecruiterNotes()).isEqualTo("Great candidate");
        verify(auditService).log(any(AuditLogParams.class));
    }

    @Test
    void shouldDeleteCandidate() {
        UUID id = UUID.randomUUID();
        Candidate candidate = createCandidateEntity();
        candidate.setId(id);

        when(candidateRepository.findById(id)).thenReturn(Optional.of(candidate));

        candidateService.delete(id, "admin@example.com", httpRequest);

        verify(candidateRepository).deleteById(id);
        verify(auditService).log(any(AuditLogParams.class));
    }

    @Test
    void shouldThrowExceptionWhenDeletingNonExistentCandidate() {
        UUID id = UUID.randomUUID();
        when(candidateRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> candidateService.delete(id, "admin@example.com", httpRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not found");
    }

    @Test
    void shouldCountCandidatesByStatus() {
        when(candidateRepository.countByStatus(Candidate.CandidateStatus.NEW)).thenReturn(5L);

        long count = candidateService.countByStatus(Candidate.CandidateStatus.NEW, "recruiter@example.com", httpRequest);

        assertThat(count).isEqualTo(5L);
        verify(auditService).log(any(AuditLogParams.class));
    }

    private CandidateRequestDTO createValidRequest() {
        return CandidateRequestDTO.builder()
                .fullName("John Doe")
                .email("john@example.com")
                .phone("+1-555-0123")
                .yearsOfExperience(5)
                .technicalSkills(List.of("React", "TypeScript"))
                .location("San Francisco, CA")
                .remotePreference(Candidate.RemotePreference.REMOTE)
                .noticePeriod("30 days")
                .salaryExpectation(150000)
                .currency("USD")
                .resumeUrl("https://example.com/resume.pdf")
                .build();
    }

    private Candidate createCandidateEntity() {
        return Candidate.builder()
                .fullName("John Doe")
                .email("john@example.com")
                .phone("+1-555-0123")
                .yearsOfExperience(5)
                .technicalSkills(List.of("React", "TypeScript"))
                .location("San Francisco, CA")
                .remotePreference(Candidate.RemotePreference.REMOTE)
                .noticePeriod("30 days")
                .salaryExpectation(150000)
                .currency("USD")
                .resumeUrl("https://example.com/resume.pdf")
                .status(Candidate.CandidateStatus.NEW)
                .build();
    }
}