package com.resume.shortlister.repository;

import com.resume.shortlister.domain.Recruiter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RecruiterRepository extends JpaRepository<Recruiter, java.util.UUID> {
    Optional<Recruiter> findByEmail(String email);
    boolean existsByEmail(String email);
}