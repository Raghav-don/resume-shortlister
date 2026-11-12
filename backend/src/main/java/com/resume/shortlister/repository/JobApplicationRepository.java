package com.resume.shortlister.repository;

import com.resume.shortlister.domain.JobApplication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface JobApplicationRepository extends JpaRepository<JobApplication, UUID> {

    Optional<JobApplication> findByIdAndApplicantId(UUID id, UUID applicantId);

    Page<JobApplication> findByApplicantId(UUID applicantId, Pageable pageable);

    Page<JobApplication> findByJobId(UUID jobId, Pageable pageable);

    @Query("""
        SELECT j FROM JobApplication j
        WHERE (:jobId IS NULL OR j.jobId = :jobId)
        AND (:applicantId IS NULL OR j.applicantId = :applicantId)
        AND (:status IS NULL OR j.status = :status)
        ORDER BY j.appliedAt DESC
        """)
    Page<JobApplication> findWithFilters(
            @Param("jobId") UUID jobId,
            @Param("applicantId") UUID applicantId,
            @Param("status") JobApplication.ApplicationStatus status,
            Pageable pageable
    );

    long countByJobId(UUID jobId);

    boolean existsByJobIdAndApplicantId(UUID jobId, UUID applicantId);
}
