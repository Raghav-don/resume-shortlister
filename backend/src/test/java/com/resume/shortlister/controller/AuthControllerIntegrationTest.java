package com.resume.shortlister.controller;

import com.resume.shortlister.domain.Recruiter;
import com.resume.shortlister.repository.RecruiterRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@Transactional
class AuthControllerIntegrationTest {

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
    private RecruiterRepository recruiterRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void shouldRegisterNewRecruiter() throws Exception {
        String requestJson = """
                {
                    "fullName": "John Doe",
                    "email": "john@example.com",
                    "password": "password123"
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").value(86400))
                .andExpect(jsonPath("$.recruiter.fullName").value("John Doe"))
                .andExpect(jsonPath("$.recruiter.email").value("john@example.com"))
                .andExpect(jsonPath("$.recruiter.roles").value(contains("RECRUITER")));
    }

    @Test
    void shouldRejectDuplicateEmail() throws Exception {
        Recruiter existing = Recruiter.builder()
                .fullName("Existing")
                .email("duplicate@example.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .roles(List.of(Recruiter.Role.RECRUITER))
                .isActive(true)
                .build();
        recruiterRepository.save(existing);

        String requestJson = """
                {
                    "fullName": "New User",
                    "email": "duplicate@example.com",
                    "password": "password123"
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Bad Request"));
    }

    @Test
    void shouldLoginSuccessfully() throws Exception {
        Recruiter recruiter = Recruiter.builder()
                .fullName("Test User")
                .email("test@example.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .roles(List.of(Recruiter.Role.RECRUITER))
                .isActive(true)
                .build();
        recruiterRepository.save(recruiter);

        String requestJson = """
                {
                    "email": "test@example.com",
                    "password": "password123"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.recruiter.email").value("test@example.com"));
    }

    @Test
    void shouldRejectInvalidCredentials() throws Exception {
        String requestJson = """
                {
                    "email": "test@example.com",
                    "password": "wrongpassword"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    void shouldRejectMissingFields() throws Exception {
        String requestJson = """
                {
                    "email": "test@example.com"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Failed"));
    }
}