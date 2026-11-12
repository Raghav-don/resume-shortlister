package com.resume.shortlister.repository;

import com.resume.shortlister.domain.Job;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface JobRepository extends JpaRepository<Job, UUID> {

    Optional<Job> findByIdAndPostedBy(UUID id, String postedBy);

    List<Job> findByPostedBy(String postedBy);

    @Query("""
        SELECT j FROM Job j
        WHERE (:title IS NULL OR :title = '' OR LOWER(j.title) LIKE LOWER(CONCAT('%', :title, '%')))
        AND (:status IS NULL OR j.status = :status)
        AND (:candidateLevel IS NULL OR j.candidateLevel = :candidateLevel)
        AND (:employmentType IS NULL OR j.employmentType = :employmentType)
        AND (:workMode IS NULL OR j.workMode = :workMode)
        AND (:applicationDeadline IS NULL OR j.applicationDeadline >= :applicationDeadline)
        ORDER BY j.createdAt DESC
        """)
    Page<Job> findWithFilters(
            @Param("title") String title,
            @Param("status") Job.JobStatus status,
            @Param("candidateLevel") Job.CandidateLevel candidateLevel,
            @Param("employmentType") Job.EmploymentType employmentType,
            @Param("workMode") Job.RemoteWorkMode workMode,
            @Param("applicationDeadline") LocalDate applicationDeadline,
            Pageable pageable
    );

    long countByStatus(Job.JobStatus status);

    boolean existsByTitleAndPostedBy(String title, String postedBy);
}
