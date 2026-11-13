package com.resume.shortlister;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public final class ResumeShortlisterApplication {

    private ResumeShortlisterApplication() {
    }

    public static void main(String[] args) {
        SpringApplication.run(ResumeShortlisterApplication.class, args);
    }
}