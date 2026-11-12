package com.resume.shortlister.config;

import com.resume.shortlister.domain.Recruiter;
import com.resume.shortlister.repository.RecruiterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    @Override
    public void run(String... args) throws Exception {
        if (recruiterRepository.count() > 0) {
            log.info("Recruiters already exist, skipping seed data.");
            return;
        }

        Recruiter admin = Recruiter.builder()
                .fullName("Admin User")
                .email("admin@resumeshortlister.com")
                .passwordHash(passwordEncoder.encode("Admin123!"))
                .roles(List.of(Recruiter.Role.ADMIN, Recruiter.Role.RECRUITER))
                .isActive(true)
                .build();

        recruiterRepository.save(admin);
        log.info("Seeded default admin account: email=admin@resumeshortlister.com, password=Admin123!");
    }
}
