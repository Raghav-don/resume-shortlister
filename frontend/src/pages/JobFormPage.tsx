import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jobApi, type JobRequest } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Input';
import { Select } from '../components/ui/Input';
import toast from 'react-hot-toast';

const EMPLOYMENT_TYPES: { value: string; label: string }[] = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'FREELANCE', label: 'Freelance' },
];

const WORK_MODES: { value: string; label: string }[] = [
  { value: 'REMOTE', label: 'Remote' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'ON_SITE', label: 'On-site' },
];

const CANDIDATE_LEVELS: { value: string; label: string }[] = [
  { value: 'FRESHER', label: 'Fresher' },
  { value: 'EXPERIENCED', label: 'Experienced' },
  { value: 'BOTH', label: 'Both' },
];

const SALARY_CURRENCIES: { value: string; label: string }[] = [
  { value: 'USD', label: 'USD' },
  { value: 'INR', label: 'INR' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
];

const SALARY_PERIODS: { value: string; label: string }[] = [
  { value: 'ANNUAL', label: 'Per Annum' },
  { value: 'MONTHLY', label: 'Per Month' },
];

const YEARS = Array.from({ length: 51 }, (_, i) => ({ value: i, label: i === 0 ? '0 years' : i === 1 ? '1 year' : `${i} years` }));
const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i, label: i === 0 ? '0 months' : i === 1 ? '1 month' : `${i} months` }));

interface TagInputProps {
  label: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  helperText?: string;
}

function TagInput({ label, value, onChange, placeholder, maxTags, helperText }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    const tag = inputValue.trim();
    if (!tag || value.includes(tag)) return;
    if (maxTags && value.length >= maxTags) return;
    onChange([...value, tag]);
    setInputValue('');
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="w-full">
      <label className="label">{label}</label>
      <div className="flex flex-wrap gap-2 mt-1">
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="p-0 text-gray-500 hover:text-red-600"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
          }}
          onBlur={addTag}
          placeholder={placeholder}
          className="input flex-1 min-w-[120px] text-sm"
        />
      </div>
      {maxTags && value.length >= maxTags && (
        <p className="mt-1 text-xs text-red-600">Maximum {maxTags} tags reached</p>
      )}
      {helperText && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
    </div>
  );
}

export function JobFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const isEdit = !!id;

  const [form, setForm] = useState<JobRequest>({
    title: '',
    jobDescription: '',
    eligibilityCriteria: '',
    preferredTechnicalSkills: [],
    employmentType: 'FULL_TIME',
    workMode: 'REMOTE',
    officeLocation: '',
    candidateLevel: 'FRESHER',
    minExperienceYears: 0,
    minExperienceMonths: 0,
    maxExperienceYears: undefined,
    maxExperienceMonths: undefined,
    educationRequirement: '',
    department: '',
    perksAndBenefits: [],
    hiringProcess: [],
    salaryMin: undefined,
    salaryMax: undefined,
    salaryCurrency: 'USD',
    salaryPeriod: 'ANNUAL',
    hideSalary: false,
    applicationDeadline: undefined,
    contactEmail: '',
    applicationUrl: '',
    status: 'ACTIVE',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const showOfficeLocation = form.workMode !== 'REMOTE';
  const showExperienceFields = form.candidateLevel === 'EXPERIENCED' || form.candidateLevel === 'BOTH';

  const handleChange = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  const handleToggle = (field: string) => {
    setForm((prev) => ({ ...prev, [field]: !prev[field as keyof JobRequest] }));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = 'Job title is required';
    if (!form.jobDescription.trim()) next.jobDescription = 'Job description is required';
    if (!form.eligibilityCriteria.trim()) next.eligibilityCriteria = 'Eligibility criteria is required';
    if (form.preferredTechnicalSkills.length === 0) next.preferredTechnicalSkills = 'At least one preferred technical skill is required';
    if (form.candidateLevel !== 'FRESHER') {
      if (form.minExperienceYears == null || form.minExperienceMonths == null) {
        next.minExperienceYears = 'Minimum experience is required for experienced candidates';
      }
      if (form.maxExperienceYears != null && form.maxExperienceMonths != null) {
        const minTotal = form.minExperienceYears * 12 + form.minExperienceMonths;
        const maxTotal = form.maxExperienceYears * 12 + form.maxExperienceMonths;
        if (maxTotal < minTotal) {
          next.maxExperienceYears = 'Maximum experience cannot be less than minimum';
        }
      }
    }
    if (form.salaryMin != null && form.salaryMax != null && form.salaryMax < form.salaryMin) {
      next.salaryMax = 'Maximum salary cannot be less than minimum';
    }
    if (showOfficeLocation && !form.officeLocation?.trim()) {
      next.officeLocation = 'Office location is required for hybrid or on-site roles';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      if (isEdit && id) {
        await jobApi.update(id, form);
        toast.success('Job updated');
        navigate('/jobs');
      } else {
        await jobApi.create(form);
        toast.success('Job posted');
        navigate('/jobs');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to save job';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const cancel = () => {
    navigate('/jobs');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Job Role' : 'Post a New Job Role'}</h1>
          <p className="text-gray-500 mt-1">
            {isEdit ? 'Update the details of this job posting.' : 'Create a job role to start receiving applications from candidates.'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={cancel}>Cancel</Button>
          <Button type="submit" form="job-form" isLoading={isLoading}>
            {isEdit ? 'Update Job' : 'Post Job'}
          </Button>
        </div>
      </div>

      <form id="job-form" onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-600" /> 1. Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="col-span-full lg:col-span-2">
              <Input
                label="Job Title *"
                value={form.title}
                error={errors.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., Frontend Engineer"
              />
            </div>
            <div className="lg:col-span-1">
              <Select
                label="Employment Type *"
                options={EMPLOYMENT_TYPES}
                value={form.employmentType}
                onChange={(e) => handleChange('employmentType', e.target.value)}
                error={errors.employmentType}
              />
            </div>
            <div className="lg:col-span-1">
              <Select
                label="Work Mode *"
                options={WORK_MODES}
                value={form.workMode}
                onChange={(e) => {
                  handleChange('workMode', e.target.value);
                  if (e.target.value === 'REMOTE') {
                    handleChange('officeLocation', '');
                  }
                }}
                error={errors.workMode}
              />
            </div>
            {showOfficeLocation && (
              <div className="lg:col-span-1">
                <Input
                  label="Office Location (City, Country)"
                  value={form.officeLocation ?? ''}
                  error={errors.officeLocation}
                  onChange={(e) => handleChange('officeLocation', e.target.value)}
                  placeholder="e.g., Bangalore, India"
                  helperText="Required for Hybrid or On-site roles"
                />
              </div>
            )}
            <div className="col-span-full lg:col-span-2">
              <Select
                label="Department"
                options={[
                  { value: 'Engineering', label: 'Engineering' },
                  { value: 'Product', label: 'Product' },
                  { value: 'Design', label: 'Design' },
                  { value: 'Marketing', label: 'Marketing' },
                  { value: 'Sales', label: 'Sales' },
                  { value: 'Operations', label: 'Operations' },
                  { value: 'Human Resources', label: 'Human Resources' },
                  { value: 'Other', label: 'Other' },
                ]}
                value={form.department ?? ''}
                onChange={(e) => handleChange('department', e.target.value)}
                placeholder="Select a department"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Experience & Qualifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-600" /> 2. Experience & Qualifications
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <Select
                label="Candidate Level *"
                options={CANDIDATE_LEVELS}
                value={form.candidateLevel}
                onChange={(e) => handleChange('candidateLevel', e.target.value)}
                error={errors.candidateLevel}
              />
            </div>
            {showExperienceFields && (
              <>
                <div className="lg:col-span-1">
                  <Select
                    label="Minimum Experience - Years *"
                    options={YEARS.map(({ value, label }) => ({ value: String(value), label }))}
                    value={String(form.minExperienceYears ?? 0)}
                    onChange={(e) => handleChange('minExperienceYears', parseInt(e.target.value, 10) || 0)}
                    error={errors.minExperienceYears}
                  />
                </div>
                <div className="lg:col-span-1">
                  <Select
                    label="Minimum Experience - Months *"
                    options={MONTHS.map(({ value, label }) => ({ value: String(value), label }))}
                    value={String(form.minExperienceMonths ?? 0)}
                    onChange={(e) => handleChange('minExperienceMonths', parseInt(e.target.value, 10) || 0)}
                    error={errors.minExperienceMonths}
                  />
                </div>
                <div className="lg:col-span-1">
                  <Select
                    label="Maximum Experience - Years"
                    options={YEARS.map(({ value, label }) => ({ value: String(value), label }))}
                    value={form.maxExperienceYears != null ? String(form.maxExperienceYears) : ''}
                    placeholder="Optional"
                    onChange={(e) => handleChange('maxExperienceYears', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    error={errors.maxExperienceYears}
                  />
                </div>
                <div className="lg:col-span-1">
                  <Select
                    label="Maximum Experience - Months"
                    options={MONTHS.map(({ value, label }) => ({ value: String(value), label }))}
                    value={form.maxExperienceMonths != null ? String(form.maxExperienceMonths) : ''}
                    placeholder="Optional"
                    onChange={(e) => handleChange('maxExperienceMonths', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    error={errors.maxExperienceMonths}
                  />
                </div>
              </>
            )}
            <div className="col-span-full lg:col-span-2">
              <Input
                label="Education Requirement"
                value={form.educationRequirement ?? ''}
                onChange={(e) => handleChange('educationRequirement', e.target.value)}
                placeholder="e.g., B.E. / B.Tech in Computer Science"
                helperText="Minimum degree required"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Role Details & Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-600" /> 3. Role Details & Skills
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            <div className="col-span-full">
              <Textarea
                label="Job Description *"
                value={form.jobDescription}
                error={errors.jobDescription}
                onChange={(e) => handleChange('jobDescription', e.target.value)}
                placeholder="Describe responsibilities, daily expectations, and what the role entails..."
                helperText="Responsibilities and day-to-day expectations for the role"
              />
            </div>
            <div className="col-span-full">
              <Textarea
                label="Eligibility Criteria *"
                value={form.eligibilityCriteria}
                error={errors.eligibilityCriteria}
                onChange={(e) => handleChange('eligibilityCriteria', e.target.value)}
                placeholder="List must-have qualifications, background checks, visa status, etc..."
                helperText="Must-have qualifications and background requirements"
              />
            </div>
            <div className="col-span-full">
              <TagInput
                label="Preferred Technical Skills *"
                value={form.preferredTechnicalSkills}
                onChange={(tags) => handleChange('preferredTechnicalSkills', tags)}
                placeholder="Type a skill and press Enter"
                maxTags={20}
                helperText="e.g., React, Node.js, PostgreSQL, AWS"
              />
            </div>
            <div className="col-span-full">
              <TagInput
                label="Perks & Benefits"
                value={form.perksAndBenefits ?? []}
                onChange={(tags) => handleChange('perksAndBenefits', tags)}
                placeholder="e.g., Health insurance, Flexible hours"
                maxTags={10}
                helperText="Optional - what makes this role attractive"
              />
            </div>
            <div className="col-span-full">
              <TagInput
                label="Hiring Process / Interview Steps"
                value={form.hiringProcess ?? []}
                onChange={(tags) => handleChange('hiringProcess', tags)}
                placeholder="e.g., Online Test, Tech Round, HR Round"
                maxTags={10}
                helperText="Helps candidates set expectations"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Compensation & Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-600" /> 4. Compensation & Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <Input
                label="Min Salary"
                type="number"
                value={form.salaryMin != null ? String(form.salaryMin) : ''}
                onChange={(e) => handleChange('salaryMin', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                placeholder="e.g., 80000"
                error={errors.salaryMin}
              />
            </div>
            <div className="lg:col-span-1">
              <Input
                label="Max Salary"
                type="number"
                value={form.salaryMax != null ? String(form.salaryMax) : ''}
                onChange={(e) => handleChange('salaryMax', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                placeholder="e.g., 150000"
                error={errors.salaryMax}
              />
            </div>
            <div className="lg:col-span-1">
              <Select
                label="Currency"
                options={SALARY_CURRENCIES}
                value={form.salaryCurrency ?? 'USD'}
                onChange={(e) => handleChange('salaryCurrency', e.target.value)}
              />
            </div>
            <div className="lg:col-span-1">
              <Select
                label="Period"
                options={SALARY_PERIODS}
                value={form.salaryPeriod ?? 'ANNUAL'}
                onChange={(e) => handleChange('salaryPeriod', e.target.value as any)}
              />
            </div>
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.hideSalary ?? false}
                  onChange={() => handleToggle('hideSalary')}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label className="text-sm text-gray-600">Hide salary on public post?</label>
              </div>
            </div>
            <div className="lg:col-span-2">
              <Input
                label="Application Deadline"
                type="date"
                value={form.applicationDeadline ?? ''}
                onChange={(e) => handleChange('applicationDeadline', e.target.value || undefined)}
                helperText="Applications will close after this date"
              />
            </div>
            <div className="col-span-full lg:col-span-2">
              <Input
                label="Contact Email"
                type="email"
                value={form.contactEmail ?? ''}
                onChange={(e) => handleChange('contactEmail', e.target.value)}
                placeholder="e.g., hiring@company.com"
                helperText="Where applications should be routed"
              />
            </div>
            <div className="col-span-full lg:col-span-2">
              <Input
                label="Application URL"
                type="url"
                value={form.applicationUrl ?? ''}
                onChange={(e) => handleChange('applicationUrl', e.target.value)}
                placeholder="https://company.com/careers/apply"
                helperText="External application link (optional)"
              />
            </div>
          </CardContent>
        </Card>

        <CardFooter className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={cancel} isLoading={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {isEdit ? 'Update Job Role' : 'Post Job Role'}
          </Button>
        </CardFooter>
      </form>
    </div>
  );
}
