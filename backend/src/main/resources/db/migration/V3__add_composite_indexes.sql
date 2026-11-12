-- V3: Add composite indexes for query performance

-- Composite indexes for candidate filtering queries
CREATE INDEX idx_candidates_experience_status ON candidates(years_of_experience, status);
CREATE INDEX idx_candidates_location_status ON candidates(location, status);
CREATE INDEX idx_candidates_remote_status ON candidates(remote_preference, status);
CREATE INDEX idx_candidates_salary_status ON candidates(salary_expectation, status);
CREATE INDEX idx_candidates_created_status ON candidates(created_at DESC, status);

-- Index on candidate_skills for skills filter
CREATE INDEX idx_candidate_skills_skill ON candidate_skills(skill);

-- Covering index for common list query
CREATE INDEX idx_candidates_list_covering ON candidates(status, created_at DESC)
INCLUDE (full_name, email, years_of_experience, location, remote_preference, notice_period, salary_expectation, currency);