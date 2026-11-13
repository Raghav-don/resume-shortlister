package com.resume.shortlister.repository;

import com.resume.shortlister.domain.Candidate;
import com.resume.shortlister.dto.CandidateFilterDTO;
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
        WHERE (:#{#filter.minExperience} IS NULL OR c.yearsOfExperience >= :#{#filter.minExperience})
        AND (:#{#filter.maxExperience} IS NULL OR c.yearsOfExperience <= :#{#filter.maxExperience})
        AND (:#{#filter.skills} IS NULL OR :#{#filter.skills} = '' OR SIZE(c.technicalSkills) > 0 AND (
            SELECT COUNT(s) FROM Candidate c2 JOIN c2.technicalSkills s
            WHERE c2.id = c.id AND s IN :#{#filter.skillList}
        ) > 0)
        AND (:#{#filter.location} IS NULL OR :#{#filter.location} = '' OR LOWER(c.location) LIKE
            LOWER(CONCAT('%', :#{#filter.location}, '%')))
        AND (:#{#filter.remotePreference} IS NULL OR c.remotePreference = :#{#filter.remotePreference})
        AND (:#{#filter.noticePeriod} IS NULL OR :#{#filter.noticePeriod} = '' OR c.noticePeriod =
            :#{#filter.noticePeriod})
        AND (:#{#filter.maxSalary} IS NULL OR c.salaryExpectation <= :#{#filter.maxSalary})
        AND (:#{#filter.status} IS NULL OR c.status = :#{#filter.status})
        ORDER BY c.createdAt DESC
        """)
    Page<Candidate> findWithFilters(
            @Param("filter") CandidateFilterDTO filter,
            Pageable pageable
    );

    List<Candidate> findByStatus(Candidate.CandidateStatus status);

    long countByStatus(Candidate.CandidateStatus status);
}