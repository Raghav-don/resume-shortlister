-- Create job_applications table for applicant job applications
CREATE TABLE job_applications (
    id UUID PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES recruiters(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    resume_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    github_url VARCHAR(500),
    linkedin_url VARCHAR(500),
    current_location VARCHAR(200) NOT NULL,
    work_authorization VARCHAR(100),
    years_of_experience INTEGER NOT NULL DEFAULT 0,
    notice_period VARCHAR(50) NOT NULL,
    cover_letter TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    applied_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_job_application_job ON job_applications(job_id);
CREATE INDEX idx_job_application_applicant ON job_applications(applicant_id);
CREATE INDEX idx_job_application_status ON job_applications(status);
CREATE INDEX idx_job_application_email ON job_applications(email);
CREATE INDEX idx_job_application_created ON job_applications(applied_at DESC);
