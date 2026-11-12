-- Add resume file, skills, remote preference and salary fields to job applications
ALTER TABLE job_applications
    ADD COLUMN IF NOT EXISTS resume_file_name VARCHAR(500),
    ADD COLUMN IF NOT EXISTS remote_preference VARCHAR(20),
    ADD COLUMN IF NOT EXISTS salary_expectation INTEGER,
    ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';

-- Technical skills collection for job applications
CREATE TABLE IF NOT EXISTS job_application_skills (
    job_application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
    skill VARCHAR(50) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_job_application_skills_job_app_id ON job_application_skills(job_application_id);
