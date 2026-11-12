-- V8: Add REVIEWED status to candidates check constraint
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_status_check;
ALTER TABLE candidates ADD CONSTRAINT candidates_status_check
    CHECK (status IN ('NEW', 'SHORTLISTED', 'REVIEWED', 'REJECTED', 'CONTACTED', 'INTERVIEWING', 'HIRED'));
