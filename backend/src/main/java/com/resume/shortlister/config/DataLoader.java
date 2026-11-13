package com.resume.shortlister.config;

import com.resume.shortlister.domain.Recruiter;
import com.resume.shortlister.repository.RecruiterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
@Profile("docker")
public class DataLoader implements CommandLineRunner {

    private final RecruiterRepository recruiterRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.admin.email:}")
    private String seedAdminEmail;

    @Value("${app.seed.admin.password:}")
    private String seedAdminPassword;

    @Value("${app.seed.enabled:false}")
    private boolean seedEnabled;

    @Override
    public void run(String... args) throws Exception {
        if (!seedEnabled) {
            log.info("Database seeding is disabled. Set app.seed.enabled=true to enable.");
            return;
        }

        if (recruiterRepository.count() > 0) {
            log.info("Recruiters already exist, skipping seed data.");
            return;
        }

        if (seedAdminEmail.isBlank() || seedAdminPassword.isBlank()) {
            log.warn("Seeding enabled but admin email/password not configured. Skipping seed.");
            return;
        }

        Recruiter admin = Recruiter.builder()
                .fullName("Admin User")
                .email(seedAdminEmail)
                .passwordHash(passwordEncoder.encode(seedAdminPassword))
                .roles(List.of(Recruiter.Role.ADMIN, Recruiter.Role.RECRUITER))
                .isActive(true)
                .build();

        recruiterRepository.save(admin);
        log.info("Seeded default admin account: email={}", seedAdminEmail);
    }
}
