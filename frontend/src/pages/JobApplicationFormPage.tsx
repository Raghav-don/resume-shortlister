import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Mail, Phone, Briefcase, MapPin, Globe, Github, Upload, CheckCircle, FileText, DollarSign } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input, Textarea, Select } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { jobApi, jobApplicationApi, type Job } from '../lib/api';
import { PageLoading } from '../components/ui/LoadingSpinner';

const NOTICE_OPTIONS = [
  { value: 'Immediate', label: 'Immediate' },
  { value: '15 days', label: '15 days' },
  { value: '30 days', label: '30 days' },
  { value: '45 days', label: '45 days' },
  { value: '60 days', label: '60 days' },
  { value: '90 days', label: '90 days' },
  { value: 'Other', label: 'Other' },
];

const WORK_AUTH_OPTIONS = [
  { value: 'Authorized', label: 'Authorized to work' },
  { value: 'Requires Sponsorship', label: 'Requires visa sponsorship' },
  { value: 'Permanent Resident', label: 'Permanent resident' },
  { value: 'Citizen', label: 'Citizen' },
  { value: 'Other', label: 'Other' },
];

const applicationSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(20).optional().or(z.literal('')),
  portfolioUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  githubUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  linkedinUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  currentLocation: z.string().min(2, 'Location is required').max(200),
  workAuthorization: z.string().max(100).optional().or(z.literal('')),
  yearsOfExperience: z.number().min(0, 'Experience cannot be negative').max(50),
  noticePeriod: z.string().min(1, 'Notice period is required').max(50),
  coverLetter: z.string().max(1000).optional().or(z.literal('')),
  technicalSkills: z.string().max(200).optional().or(z.literal('')),
  remotePreference: z.enum(['ON_SITE', 'HYBRID', 'REMOTE']).optional(),
  salaryExpectation: z.number().min(0).max(10000000).optional(),
  currency: z.enum(['INR', 'USD']).optional(),
});

type ApplicationForm = z.infer<typeof applicationSchema>;

export function JobApplicationFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [job, setJob] = useState<Job | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ApplicationForm>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      yearsOfExperience: 0,
      workAuthorization: '',
      coverLetter: '',
      technicalSkills: '',
      remotePreference: undefined,
      salaryExpectation: 0,
      currency: 'INR',
    },
  });

  useEffect(() => {
    if (!id) return;
    const fetchJob = async () => {
      try {
        const response = await jobApi.get(id);
        setJob(response.data);
        // Pre-fill from logged-in user's profile if available
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          setValue('fullName', user.fullName || '');
          setValue('email', user.email || '');
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to load job details');
        navigate('/jobs');
      }
    };
    fetchJob();
  }, [id, navigate, setValue]);

  const onSubmit: SubmitHandler<ApplicationForm> = async (data) => {
    if (!id) return;
    setIsLoading(true);
    try {
      if (!resumeFile) {
        toast.error('Please upload your resume (PDF or DOCX)');
        return;
      }
      await jobApplicationApi.apply({
        jobId: id,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone || undefined,
        portfolioUrl: data.portfolioUrl || undefined,
        githubUrl: data.githubUrl || undefined,
        linkedinUrl: data.linkedinUrl || undefined,
        currentLocation: data.currentLocation,
        workAuthorization: data.workAuthorization || undefined,
        yearsOfExperience: data.yearsOfExperience,
        noticePeriod: data.noticePeriod,
        coverLetter: data.coverLetter || undefined,
        technicalSkills: data.technicalSkills
          ? data.technicalSkills.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
        remotePreference: data.remotePreference || undefined,
        salaryExpectation: data.salaryExpectation || undefined,
        currency: data.currency || 'INR',
      }, resumeFile);
      toast.success('Application submitted successfully!');
      navigate('/my-applications');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Application failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !job) return <PageLoading />;
  if (!job) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <Link to={`/jobs/${id}`} className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 mb-2">
          <span className="w-4 h-4">←</span> Back to Job Details
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Apply for {job.title}</h1>
          <Badge variant="success">Now Hiring</Badge>
        </div>
        <p className="text-gray-600 mt-2">
          {job.department || 'Engineering'} • {job.employmentType} • {job.workMode}
        </p>
      </div>

      <Card variant="elevated" padding="lg">
        <CardHeader>
          <CardTitle>Application Form</CardTitle>
          <CardDescription>
            Fill in your details to apply for this position. All fields marked with <span className="text-red-500">*</span> are required.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Job Info */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 mb-4">
            <div className="flex items-start gap-3">
              <FileTextIcon className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">{job.title}</p>
                <p className="text-sm text-gray-500">{job.department || 'Engineering'} • {job.candidateLevel}</p>
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <fieldset>
            <legend className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              Personal Information
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Full Name *"
                placeholder="John Doe"
                autoComplete="name"
                {...register('fullName')}
                error={errors.fullName?.message}
                disabled={isLoading}
              >
                <span className="w-5 h-5 text-gray-400">👤</span>
              </Input>
              <Input
                label="Email *"
                type="email"
                placeholder="john@example.com"
                autoComplete="email"
                {...register('email')}
                error={errors.email?.message}
                disabled={isLoading}
              >
                <Mail className="w-5 h-5 text-gray-400" />
              </Input>
              <Input
                label="Phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                autoComplete="tel"
                {...register('phone')}
                error={errors.phone?.message}
                disabled={isLoading}
              >
                <Phone className="w-5 h-5 text-gray-400" />
              </Input>
              <Input
                label="Current Location *"
                placeholder="San Francisco, CA"
                autoComplete="location"
                {...register('currentLocation')}
                error={errors.currentLocation?.message}
                disabled={isLoading}
              >
                <MapPin className="w-5 h-5 text-gray-400" />
              </Input>
            </div>
          </fieldset>

          {/* Documents & Links */}
          <fieldset>
            <legend className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary-600" />
              Resume & Profile Links
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="w-full">
                <label className="label">Resume *</label>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setResumeFile(file);
                  }}
                  disabled={isLoading}
                  className="input border-gray-300 hover:border-primary-400"
                />
                {resumeFile && (
                  <p className="mt-1.5 text-sm text-green-600">
                    {resumeFile.name} ({Math.round(resumeFile.size / 1024)} KB)
                  </p>
                )}
                <p className="mt-1.5 text-sm text-gray-500">
                  Upload your PDF or DOCX resume
                </p>
              </div>
              <Input
                label="Portfolio URL"
                type="url"
                placeholder="https://johndoe.dev"
                {...register('portfolioUrl')}
                error={errors.portfolioUrl?.message}
                disabled={isLoading}
              >
                <Globe className="w-5 h-5 text-gray-400" />
              </Input>
              <Input
                label="GitHub URL"
                type="url"
                placeholder="https://github.com/johndoe"
                {...register('githubUrl')}
                error={errors.githubUrl?.message}
                disabled={isLoading}
              >
                <Github className="w-5 h-5 text-gray-400" />
              </Input>
              <Input
                label="LinkedIn URL"
                type="url"
                placeholder="https://linkedin.com/in/johndoe"
                {...register('linkedinUrl')}
                error={errors.linkedinUrl?.message}
                disabled={isLoading}
              >
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </Input>
            </div>
          </fieldset>

          {/* Work Authorization */}
          <div className="w-full">
            <label className="label">Work Authorization</label>
            <Select
              options={WORK_AUTH_OPTIONS}
              value={watch('workAuthorization') || ''}
              onChange={(e) => setValue('workAuthorization', e.target.value)}
              placeholder="Select work authorization status"
              disabled={isLoading}
            />
          </div>

          {/* Job Details */}
          <fieldset>
            <legend className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary-600" />
              Job Details
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Technical Skills"
                placeholder="React, Node.js, SQL"
                {...register('technicalSkills')}
                error={errors.technicalSkills?.message}
                disabled={isLoading}
                helperText="Comma-separated skills you bring to this role"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l4-4m0 0L9 17m0 0l4-4m4 4L9 3" /></svg>
              </Input>
              <Select
                label="Remote Preference"
                options={[
                  { value: 'ON_SITE', label: 'On-site' },
                  { value: 'HYBRID', label: 'Hybrid' },
                  { value: 'REMOTE', label: 'Remote' },
                ]}
                value={watch('remotePreference') ?? undefined}
                onChange={(e) => setValue('remotePreference', (e.target.value as "ON_SITE" | "HYBRID" | "REMOTE" | undefined))}
                placeholder="Select remote preference"
                disabled={isLoading}
              />
              <Input
                label="Salary Expectation"
                type="number"
                min="0"
                placeholder="e.g. 600000"
                {...register('salaryExpectation', { valueAsNumber: true })}
                error={errors.salaryExpectation?.message}
                disabled={isLoading}
              >
                <DollarSign className="w-5 h-5 text-gray-400" />
              </Input>
              <Select
                label="Currency"
                options={[
                  { value: 'INR', label: 'INR (₹)' },
                  { value: 'USD', label: 'USD ($)' },
                ]}
                value={watch('currency') ?? 'INR'}
                onChange={(e) => setValue('currency', (e.target.value as "USD" | "INR"))}
                disabled={isLoading}
              />
            </div>
          </fieldset>

          {/* Experience & Notice */}
          <fieldset>
            <legend className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary-600" />
              Experience & Availability
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Years of Experience *"
                type="number"
                min="0"
                max="50"
                placeholder="0"
                {...register('yearsOfExperience', { valueAsNumber: true })}
                error={errors.yearsOfExperience?.message}
                disabled={isLoading}
              >
                <Briefcase className="w-5 h-5 text-gray-400" />
              </Input>
              <Select
                label="Notice Period *"
                options={NOTICE_OPTIONS}
                value={watch('noticePeriod') || ''}
                onChange={(e) => setValue('noticePeriod', e.target.value)}
                placeholder="Select notice period"
                error={errors.noticePeriod?.message}
                disabled={isLoading}
              />
            </div>
          </fieldset>

          {/* Cover Letter */}
          <div className="w-full">
            <label className="label">Cover Letter</label>
            <Textarea
              {...register('coverLetter')}
              error={errors.coverLetter?.message}
              disabled={isLoading}
              placeholder="Tell us about yourself, why you're interested in this role, and what you bring to the team..."
              helperText="Optional - maximum 1000 characters"
            />
          </div>

          <div className="pt-4 border-t border-gray-200">
            <Button
              type="submit"
              className="w-full sm:w-auto"
              size="lg"
              isLoading={isLoading}
            >
              <CheckCircle className="w-5 h-5" /> Submit Application
            </Button>
            <p className="mt-3 text-center text-sm text-gray-500">
              By applying, you agree to our <a href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</a>
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
