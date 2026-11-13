package com.resume.shortlister.service;

import com.resume.shortlister.audit.AuditLog;
import com.resume.shortlister.audit.AuditLogParams;
import com.resume.shortlister.audit.AuditService;
import com.resume.shortlister.domain.Recruiter;
import com.resume.shortlister.dto.AuthResponse;
import com.resume.shortlister.dto.LoginRequest;
import com.resume.shortlister.dto.RegisterRequest;
import com.resume.shortlister.repository.RecruiterRepository;
import com.resume.shortlister.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final RecruiterRepository recruiterRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final AuditService auditService;

    @Transactional
    public AuthResponse register(RegisterRequest request, HttpServletRequest httpRequest) {
        if (recruiterRepository.existsByEmail(request.getEmail())) {
            auditService.log(AuditLogParams.builder()
                    .action(AuditLog.Action.RECRUITER_CREATE)
                    .userEmail(request.getEmail())
                    .entityType("Recruiter")
                    .request(httpRequest)
                    .success(false)
                    .errorMessage("Email already registered")
                    .details(Map.of("email", request.getEmail()))
                    .build());
            throw new IllegalArgumentException("Email already registered: " + request.getEmail());
        }

        Recruiter recruiter = Recruiter.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .roles(List.of(request.getRole() != null ? request.getRole() : Recruiter.Role.RECRUITER))
                .isActive(true)
                .build();

        recruiter = recruiterRepository.save(recruiter);

        auditService.log(AuditLogParams.builder()
                .action(AuditLog.Action.RECRUITER_CREATE)
                .userEmail(recruiter.getEmail())
                .userId(recruiter.getId())
                .entityType("Recruiter")
                .entityId(recruiter.getId())
                .request(httpRequest)
                .success(true)
                .details(Map.of("email", recruiter.getEmail(), "roles", recruiter.getRoles()))
                .build());

        return buildAuthResponse(recruiter);
    }

    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            Recruiter recruiter = recruiterRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new IllegalArgumentException("Recruiter not found"));

            auditService.log(AuditLogParams.builder()
                    .action(AuditLog.Action.LOGIN)
                    .userEmail(recruiter.getEmail())
                    .userId(recruiter.getId())
                    .entityType("Recruiter")
                    .entityId(recruiter.getId())
                    .request(httpRequest)
                    .success(true)
                    .details(Map.of("email", recruiter.getEmail()))
                    .build());

            return buildAuthResponse(recruiter);
        } catch (BadCredentialsException e) {
            auditService.log(AuditLogParams.builder()
                    .action(AuditLog.Action.LOGIN_FAILED)
                    .userEmail(request.getEmail())
                    .entityType("Recruiter")
                    .request(httpRequest)
                    .success(false)
                    .errorMessage("Invalid credentials")
                    .details(Map.of("email", request.getEmail()))
                    .build());
            throw e;
        }
    }

    private AuthResponse buildAuthResponse(Recruiter recruiter) {
        String token = jwtTokenProvider.generateToken(recruiter.getEmail(), recruiter.getRoles());
        return AuthResponse.builder()
                .accessToken(token)
                .expiresIn(jwtTokenProvider.getExpirationTime())
                .recruiter(AuthResponse.RecruiterInfo.builder()
                        .id(recruiter.getId())
                        .fullName(recruiter.getFullName())
                        .email(recruiter.getEmail())
                        .roles(recruiter.getRoles().stream().map(Enum::name).collect(Collectors.toList()))
                        .build())
                .build();
    }
}