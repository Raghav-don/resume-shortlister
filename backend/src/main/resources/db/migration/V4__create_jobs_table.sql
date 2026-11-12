-- Create jobs table for job posting feature
CREATE TABLE jobs (
    id UUID PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    job_description TEXT NOT NULL,
    eligibility_criteria TEXT NOT NULL,
    employment_type VARCHAR(20) NOT NULL,
    work_mode VARCHAR(20) NOT NULL,
    office_location VARCHAR(100),
    candidate_level VARCHAR(20) NOT NULL,
    min_experience_years INTEGER NOT NULL DEFAULT 0,
    min_experience_months INTEGER NOT NULL DEFAULT 0,
    max_experience_years INTEGER,
    max_experience_months INTEGER,
    education_requirement VARCHAR(100),
    department VARCHAR(100),
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR(3) DEFAULT 'USD',
    salary_period VARCHAR(10) DEFAULT 'ANNUAL',
    hide_salary BOOLEAN DEFAULT FALSE,
    application_deadline DATE,
    contact_email VARCHAR(150),
    application_url VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    posted_by VARCHAR(255) NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Preferred technical skills (element collection)
CREATE TABLE job_preferred_skills (
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    skill VARCHAR(50) NOT NULL
);
CREATE INDEX idx_job_preferred_skills_job_id ON job_preferred_skills(job_id);

-- Perks and benefits (element collection)
CREATE TABLE job_perks (
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    perk VARCHAR(100) NOT NULL
);
CREATE INDEX idx_job_perks_job_id ON job_perks(job_id);

-- Hiring process steps (element collection)
CREATE TABLE job_hiring_process (
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    step VARCHAR(200) NOT NULL
);
CREATE INDEX idx_job_hiring_process_job_id ON job_hiring_process(job_id);

-- Indexes
CREATE INDEX idx_job_title ON jobs(title);
CREATE INDEX idx_job_status ON jobs(status);
CREATE INDEX idx_job_posted_by ON jobs(posted_by);
CREATE INDEX idx_job_created_at ON jobs(created_at DESC);
