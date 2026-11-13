package com.resume.shortlister.service;

import com.resume.shortlister.audit.AuditLogParams;
import com.resume.shortlister.audit.AuditService;
import com.resume.shortlister.audit.AuditLog;
import com.resume.shortlister.domain.Recruiter;
import com.resume.shortlister.dto.AuthResponse;
import com.resume.shortlister.dto.LoginRequest;
import com.resume.shortlister.dto.RegisterRequest;
import com.resume.shortlister.repository.RecruiterRepository;
import com.resume.shortlister.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private RecruiterRepository recruiterRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private Authentication authentication;

    @Mock
    private AuditService auditService;

    @Mock
    private HttpServletRequest httpRequest;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(recruiterRepository, passwordEncoder, jwtTokenProvider, authenticationManager, auditService);
        lenient().when(httpRequest.getHeader("X-Forwarded-For")).thenReturn(null);
        lenient().when(httpRequest.getHeader("X-Real-IP")).thenReturn(null);
        lenient().when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");
        lenient().when(httpRequest.getHeader("User-Agent")).thenReturn("Test Agent");
    }

    @Test
    void shouldRegisterNewRecruiter() {
        RegisterRequest request = RegisterRequest.builder()
                .fullName("John Doe")
                .email("john@example.com")
                .password("password123")
                .build();

        Recruiter savedRecruiter = Recruiter.builder()
                .id(UUID.randomUUID())
                .fullName("John Doe")
                .email("john@example.com")
                .passwordHash("encoded-password")
                .roles(List.of(Recruiter.Role.RECRUITER))
                .isActive(true)
                .build();

        when(recruiterRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("encoded-password");
        when(recruiterRepository.save(any(Recruiter.class))).thenReturn(savedRecruiter);
        when(jwtTokenProvider.generateToken(anyString(), anyList())).thenReturn("jwt-token");
        when(jwtTokenProvider.getExpirationTime()).thenReturn(86400L);

        AuthResponse response = authService.register(request, httpRequest);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("jwt-token");
        assertThat(response.getRecruiter().getEmail()).isEqualTo("john@example.com");
        assertThat(response.getRecruiter().getRoles()).contains("RECRUITER");
        verify(recruiterRepository).save(any(Recruiter.class));
        verify(auditService).log(any(AuditLogParams.class));
    }

    @Test
    void shouldThrowExceptionWhenEmailAlreadyRegistered() {
        RegisterRequest request = RegisterRequest.builder()
                .fullName("John Doe")
                .email("john@example.com")
                .password("password123")
                .build();

        when(recruiterRepository.existsByEmail(request.getEmail())).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request, httpRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already registered");

        verify(auditService).log(any(AuditLogParams.class));
    }

    @Test
    void shouldLoginSuccessfully() {
        LoginRequest request = LoginRequest.builder()
                .email("john@example.com")
                .password("password123")
                .build();

        Recruiter recruiter = Recruiter.builder()
                .id(UUID.randomUUID())
                .fullName("John Doe")
                .email("john@example.com")
                .passwordHash("encoded-password")
                .roles(List.of(Recruiter.Role.RECRUITER))
                .isActive(true)
                .build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(recruiterRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(recruiter));
        when(jwtTokenProvider.generateToken(anyString(), anyList())).thenReturn("jwt-token");
        when(jwtTokenProvider.getExpirationTime()).thenReturn(86400L);

        AuthResponse response = authService.login(request, httpRequest);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("jwt-token");
        assertThat(response.getRecruiter().getEmail()).isEqualTo("john@example.com");
        verify(auditService).log(any(AuditLogParams.class));
    }

    @Test
    void shouldLogFailedLoginAttempt() {
        LoginRequest request = LoginRequest.builder()
                .email("john@example.com")
                .password("wrong-password")
                .build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> authService.login(request, httpRequest))
                .isInstanceOf(BadCredentialsException.class);

        verify(auditService).log(any(AuditLogParams.class));
    }

    @Test
    void shouldThrowExceptionWhenRecruiterNotFoundAfterAuth() {
        LoginRequest request = LoginRequest.builder()
                .email("john@example.com")
                .password("password123")
                .build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(recruiterRepository.findByEmail(request.getEmail())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request, httpRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Recruiter not found");
    }
}