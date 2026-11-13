package com.resume.shortlister.mapper;

import com.resume.shortlister.domain.Candidate;
import com.resume.shortlister.dto.CandidateRequestDTO;
import com.resume.shortlister.dto.CandidateResponseDTO;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class CandidateMapperTest {

    private final CandidateMapper mapper = Mappers.getMapper(CandidateMapper.class);

    @Test
    void shouldMapRequestDTOToEntity() {
        CandidateRequestDTO request = CandidateRequestDTO.builder()
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

        Candidate entity = mapper.toEntity(request);

        assertThat(entity.getFullName()).isEqualTo("John Doe");
        assertThat(entity.getEmail()).isEqualTo("john@example.com");
        assertThat(entity.getPhone()).isEqualTo("+1-555-0123");
        assertThat(entity.getYearsOfExperience()).isEqualTo(5);
        assertThat(entity.getTechnicalSkills()).containsExactly("React", "TypeScript");
        assertThat(entity.getLocation()).isEqualTo("San Francisco, CA");
        assertThat(entity.getRemotePreference()).isEqualTo(Candidate.RemotePreference.REMOTE);
        assertThat(entity.getNoticePeriod()).isEqualTo("30 days");
        assertThat(entity.getSalaryExpectation()).isEqualTo(150000);
        assertThat(entity.getCurrency()).isEqualTo("USD");
        assertThat(entity.getResumeUrl()).isEqualTo("https://example.com/resume.pdf");
        assertThat(entity.getStatus()).isEqualTo(Candidate.CandidateStatus.NEW);
    }

    @Test
    void shouldMapEntityToResponseDTO() {
        UUID id = UUID.randomUUID();
        Candidate entity = Candidate.builder()
                .id(id)
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
                .portfolioUrl("https://johndoe.dev")
                .linkedinUrl("https://linkedin.com/in/johndoe")
                .githubUrl("https://github.com/johndoe")
                .status(Candidate.CandidateStatus.SHORTLISTED)
                .recruiterNotes("Great candidate")
                .createdBy("public")
                .updatedBy("recruiter@example.com")
                .build();

        CandidateResponseDTO response = mapper.toResponseDTO(entity);

        assertThat(response.getId()).isEqualTo(id);
        assertThat(response.getFullName()).isEqualTo("John Doe");
        assertThat(response.getEmail()).isEqualTo("john@example.com");
        assertThat(response.getPhone()).isEqualTo("+1-555-0123");
        assertThat(response.getYearsOfExperience()).isEqualTo(5);
        assertThat(response.getTechnicalSkills()).containsExactly("React", "TypeScript");
        assertThat(response.getLocation()).isEqualTo("San Francisco, CA");
        assertThat(response.getRemotePreference()).isEqualTo(Candidate.RemotePreference.REMOTE);
        assertThat(response.getNoticePeriod()).isEqualTo("30 days");
        assertThat(response.getSalaryExpectation()).isEqualTo(150000);
        assertThat(response.getCurrency()).isEqualTo("USD");
        assertThat(response.getResumeUrl()).isEqualTo("https://example.com/resume.pdf");
        assertThat(response.getPortfolioUrl()).isEqualTo("https://johndoe.dev");
        assertThat(response.getLinkedinUrl()).isEqualTo("https://linkedin.com/in/johndoe");
        assertThat(response.getGithubUrl()).isEqualTo("https://github.com/johndoe");
        assertThat(response.getStatus()).isEqualTo(Candidate.CandidateStatus.SHORTLISTED);
        assertThat(response.getRecruiterNotes()).isEqualTo("Great candidate");
    }
}