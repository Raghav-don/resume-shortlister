package com.resume.shortlister.repository;

import com.resume.shortlister.domain.Candidate;
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
public interface CandidateRepository extends JpaRepository<Candidate, UUID> {

    Optional<Candidate> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("""
        SELECT c FROM Candidate c
        WHERE (:minExperience IS NULL OR c.yearsOfExperience >= :minExperience)
        AND (:maxExperience IS NULL OR c.yearsOfExperience <= :maxExperience)
        AND (:skills IS NULL OR :skills = '' OR SIZE(c.technicalSkills) > 0 AND (
            SELECT COUNT(s) FROM Candidate c2 JOIN c2.technicalSkills s WHERE c2.id = c.id AND s IN :skillList
        ) > 0)
        AND (:location IS NULL OR :location = '' OR LOWER(c.location) LIKE LOWER(CONCAT('%', :location, '%')))
        AND (:remotePreference IS NULL OR c.remotePreference = :remotePreference)
        AND (:noticePeriod IS NULL OR :noticePeriod = '' OR c.noticePeriod = :noticePeriod)
        AND (:maxSalary IS NULL OR c.salaryExpectation <= :maxSalary)
        AND (:status IS NULL OR c.status = :status)
        ORDER BY c.createdAt DESC
        """)
    Page<Candidate> findWithFilters(
            @Param("minExperience") Integer minExperience,
            @Param("maxExperience") Integer maxExperience,
            @Param("skills") String skills,
            @Param("skillList") List<String> skillList,
            @Param("location") String location,
            @Param("remotePreference") Candidate.RemotePreference remotePreference,
            @Param("noticePeriod") String noticePeriod,
            @Param("maxSalary") Integer maxSalary,
            @Param("status") Candidate.CandidateStatus status,
            Pageable pageable
    );

    List<Candidate> findByStatus(Candidate.CandidateStatus status);

    long countByStatus(Candidate.CandidateStatus status);
}