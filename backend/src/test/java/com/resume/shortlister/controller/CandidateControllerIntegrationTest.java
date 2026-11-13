package com.resume.shortlister.controller;

import com.resume.shortlister.domain.Candidate;
import com.resume.shortlister.dto.CandidateRequestDTO;
import com.resume.shortlister.repository.CandidateRepository;
import com.resume.shortlister.repository.RecruiterRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Base64;
import java.util.List;
import java.security.SecureRandom;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@Transactional
class CandidateControllerIntegrationTest {

    private static final String TEST_JWT_SECRET = Base64.getEncoder()
            .encodeToString(new SecureRandom().generateSeed(64));

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("resume_shortlister")
            .withUsername("postgres")
            .withPassword("postgres");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("app.jwt.secret", () -> TEST_JWT_SECRET);
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CandidateRepository candidateRepository;

    @Autowired
    private RecruiterRepository recruiterRepository;

    @Test
    void shouldCreateCandidatePublicly() throws Exception {
        String requestJson = """
                {
                    "fullName": "John Doe",
                    "email": "john@example.com",
                    "yearsOfExperience": 5,
                    "technicalSkills": ["React", "TypeScript"],
                    "location": "San Francisco, CA",
                    "remotePreference": "REMOTE",
                    "noticePeriod": "30 days",
                    "salaryExpectation": 150000
                }
                """;

        mockMvc.perform(post("/api/candidates")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("John Doe"))
                .andExpect(jsonPath("$.email").value("john@example.com"))
                .andExpect(jsonPath("$.status").value("NEW"));
    }

    @Test
    void shouldRejectDuplicateEmail() throws Exception {
        Candidate existing = Candidate.builder()
                .fullName("Existing")
                .email("duplicate@example.com")
                .yearsOfExperience(3)
                .technicalSkills(List.of("Java"))
                .location("New York")
                .remotePreference(Candidate.RemotePreference.ON_SITE)
                .noticePeriod("30 days")
                .salaryExpectation(100000)
                .build();
        candidateRepository.save(existing);

        String requestJson = """
                {
                    "fullName": "New Candidate",
                    "email": "duplicate@example.com",
                    "yearsOfExperience": 5,
                    "technicalSkills": ["React"],
                    "location": "San Francisco",
                    "remotePreference": "REMOTE",
                    "noticePeriod": "30 days",
                    "salaryExpectation": 150000
                }
                """;

        mockMvc.perform(post("/api/candidates")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Failed"));
    }

    @Test
    @WithMockUser(roles = "RECRUITER")
    void shouldListCandidatesWithFilters() throws Exception {
        Candidate candidate = Candidate.builder()
                .fullName("Test Candidate")
                .email("test@example.com")
                .yearsOfExperience(5)
                .technicalSkills(List.of("React", "TypeScript"))
                .location("San Francisco")
                .remotePreference(Candidate.RemotePreference.REMOTE)
                .noticePeriod("30 days")
                .salaryExpectation(150000)
                .build();
        candidateRepository.save(candidate);

        mockMvc.perform(get("/api/candidates")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").value(greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.content[0].fullName").value("Test Candidate"));
    }

    @Test
    @WithMockUser(roles = "RECRUITER")
    void shouldFilterByMinExperience() throws Exception {
        Candidate junior = Candidate.builder()
                .fullName("Junior")
                .email("junior@example.com")
                .yearsOfExperience(2)
                .technicalSkills(List.of("React"))
                .location("SF")
                .remotePreference(Candidate.RemotePreference.REMOTE)
                .noticePeriod("30 days")
                .salaryExpectation(80000)
                .build();

        Candidate senior = Candidate.builder()
                .fullName("Senior")
                .email("senior@example.com")
                .yearsOfExperience(8)
                .technicalSkills(List.of("React"))
                .location("SF")
                .remotePreference(Candidate.RemotePreference.REMOTE)
                .noticePeriod("30 days")
                .salaryExpectation(180000)
                .build();

        candidateRepository.saveAll(List.of(junior, senior));

        mockMvc.perform(get("/api/candidates")
                        .param("minExperience", "5")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[*].yearsOfExperience", everyItem(greaterThanOrEqualTo(5))));
    }

    @Test
    @WithMockUser(roles = "RECRUITER")
    void shouldFilterBySkills() throws Exception {
        Candidate reactDev = Candidate.builder()
                .fullName("React Dev")
                .email("react@example.com")
                .yearsOfExperience(5)
                .technicalSkills(List.of("React", "TypeScript"))
                .location("SF")
                .remotePreference(Candidate.RemotePreference.REMOTE)
                .noticePeriod("30 days")
                .salaryExpectation(150000)
                .build();

        Candidate javaDev = Candidate.builder()
                .fullName("Java Dev")
                .email("java@example.com")
                .yearsOfExperience(5)
                .technicalSkills(List.of("Java", "Spring"))
                .location("SF")
                .remotePreference(Candidate.RemotePreference.REMOTE)
                .noticePeriod("30 days")
                .salaryExpectation(150000)
                .build();

        candidateRepository.saveAll(List.of(reactDev, javaDev));

        mockMvc.perform(get("/api/candidates")
                        .param("skills", "React")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].technicalSkills", everyItem(hasItem("React"))));
    }

    @Test
    @WithMockUser(roles = "RECRUITER")
    void shouldGetCandidateById() throws Exception {
        Candidate candidate = Candidate.builder()
                .fullName("Test Candidate")
                .email("test@example.com")
                .yearsOfExperience(5)
                .technicalSkills(List.of("React"))
                .location("SF")
                .remotePreference(Candidate.RemotePreference.REMOTE)
                .noticePeriod("30 days")
                .salaryExpectation(150000)
                .build();
        Candidate saved = candidateRepository.save(candidate);

        mockMvc.perform(get("/api/candidates/{id}", saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Test Candidate"))
                .andExpect(jsonPath("$.email").value("test@example.com"));
    }

    @Test
    @WithMockUser(roles = "RECRUITER")
    void shouldReturn404ForNonExistentCandidate() throws Exception {
        UUID randomId = UUID.randomUUID();

        mockMvc.perform(get("/api/candidates/{id}", randomId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Not Found"));
    }

    @Test
    @WithMockUser(roles = "RECRUITER")
    void shouldUpdateCandidateStatus() throws Exception {
        Candidate candidate = Candidate.builder()
                .fullName("Test Candidate")
                .email("test@example.com")
                .yearsOfExperience(5)
                .technicalSkills(List.of("React"))
                .location("SF")
                .remotePreference(Candidate.RemotePreference.REMOTE)
                .noticePeriod("30 days")
                .salaryExpectation(150000)
                .status(Candidate.CandidateStatus.NEW)
                .build();
        Candidate saved = candidateRepository.save(candidate);

        mockMvc.perform(patch("/api/candidates/{id}/status", saved.getId())
                        .param("status", "SHORTLISTED")
                        .param("recruiterNotes", "Great candidate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SHORTLISTED"))
                .andExpect(jsonPath("$.recruiterNotes").value("Great candidate"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldDeleteCandidate() throws Exception {
        Candidate candidate = Candidate.builder()
                .fullName("To Delete")
                .email("delete@example.com")
                .yearsOfExperience(5)
                .technicalSkills(List.of("React"))
                .location("SF")
                .remotePreference(Candidate.RemotePreference.REMOTE)
                .noticePeriod("30 days")
                .salaryExpectation(150000)
                .build();
        Candidate saved = candidateRepository.save(candidate);

        mockMvc.perform(delete("/api/candidates/{id}", saved.getId()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/candidates/{id}", saved.getId()))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "RECRUITER")
    void shouldGetStats() throws Exception {
        Candidate c1 = Candidate.builder()
                .fullName("New")
                .email("new@example.com")
                .yearsOfExperience(3)
                .technicalSkills(List.of("React"))
                .location("SF")
                .remotePreference(Candidate.RemotePreference.REMOTE)
                .noticePeriod("30 days")
                .salaryExpectation(100000)
                .status(Candidate.CandidateStatus.NEW)
                .build();

        Candidate c2 = Candidate.builder()
                .fullName("Shortlisted")
                .email("short@example.com")
                .yearsOfExperience(5)
                .technicalSkills(List.of("React"))
                .location("SF")
                .remotePreference(Candidate.RemotePreference.REMOTE)
                .noticePeriod("30 days")
                .salaryExpectation(150000)
                .status(Candidate.CandidateStatus.SHORTLISTED)
                .build();

        candidateRepository.saveAll(List.of(c1, c2));

        mockMvc.perform(get("/api/candidates/stats/count-by-status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.NEW").value(greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.SHORTLISTED").value(greaterThanOrEqualTo(1)));
    }
}