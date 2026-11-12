import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { jobApi, jobApplicationApi, type Job } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Briefcase, Clock, MapPin, DollarSign, GraduationCap, Link as LinkIcon, Mail, Tag, Building2 } from 'lucide-react';
import { PageLoading } from '../components/ui/LoadingSpinner';
import { formatCurrency, formatExperience, formatRelativeTime } from '../lib/utils';
import toast from 'react-hot-toast';

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  FREELANCE: 'Freelance',
};

const WORK_MODE_LABELS: Record<string, string> = {
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
  ON_SITE: 'On-site',
};

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [applicationCount, setApplicationCount] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchJob = async () => {
      try {
        const response = await jobApi.get(id);
        setJob(response.data);
        const countResponse = await jobApplicationApi.countByJob(id);
        setApplicationCount(countResponse.data);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to load job details');
        navigate('/jobs');
      } finally {
        setIsLoading(false);
      }
    };
    fetchJob();
  }, [id, navigate]);

  const handleApply = () => {
    if (!job) return;
    navigate(`/jobs/applicant/${job.id}/apply`);
  };

  if (isLoading) return <PageLoading />;
  if (!job) return null;

  const experienceLabel = formatExperience(job);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/jobs" className="text-sm text-gray-500 hover:text-primary-600">
          ← Back to jobs
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{job.title}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    {job.department || 'Engineering'} • {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
                  </p>
                </div>
                <Badge variant="success" size="md">
                  {job.status === 'ACTIVE' ? 'Now Hiring' : job.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-primary-600" /> About the Role
                  </h3>
                  <div className="prose prose-sm text-gray-700 max-w-none">{job.jobDescription}</div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-primary-600" /> Eligibility Criteria
                  </h3>
                  <div className="prose prose-sm text-gray-700 max-w-none">{job.eligibilityCriteria}</div>
                </div>

                {job.perksAndBenefits && job.perksAndBenefits.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Tag className="w-5 h-5 text-primary-600" /> Perks & Benefits
                    </h3>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      {job.perksAndBenefits.map((perk) => (
                        <li key={perk}>{perk}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {job.hiringProcess && job.hiringProcess.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary-600" /> Hiring Process
                    </h3>
                    <ol className="list-decimal list-inside text-gray-700 space-y-1">
                      {job.hiringProcess.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {job.applicationDeadline && (
            <Card>
              <CardHeader>
                <CardTitle>Application Deadline</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-sm">{formatRelativeTime(job.applicationDeadline)}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card variant="elevated">
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Location</p>
                    <p className="text-sm text-gray-600">{job.officeLocation || job.workMode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Experience</p>
                    <p className="text-sm text-gray-600">{experienceLabel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Work Mode</p>
                    <p className="text-sm text-gray-600">{WORK_MODE_LABELS[job.workMode]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Education</p>
                    <p className="text-sm text-gray-600">{job.educationRequirement || 'Not specified'}</p>
                  </div>
                </div>
                {(job.salaryMin || job.salaryMax) && !job.hideSalary && (
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-primary-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Salary</p>
                      <p className="text-sm text-gray-600">
                        {job.salaryMin && job.salaryMax
                          ? `${formatCurrency(job.salaryMin, job.salaryCurrency)} - ${formatCurrency(job.salaryMax, job.salaryCurrency)}`
                          : job.salaryMin
                            ? `${formatCurrency(job.salaryMin, job.salaryCurrency)}+`
                            : job.salaryMax
                              ? `Up to ${formatCurrency(job.salaryMax, job.salaryCurrency)}`
                              : 'Not specified'}
                        {` ${job.salaryPeriod === 'MONTHLY' ? 'per month' : 'per year'}`}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Contact Email</p>
                    <p className="text-sm text-gray-600">{job.contactEmail || 'Not provided'}</p>
                  </div>
                </div>
              </div>
              <div className="pt-6">
                {applicationCount != null && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <FileTextIcon className="w-4 h-4" />
                    <span>{applicationCount} application{applicationCount !== 1 ? 's' : ''} received</span>
                  </div>
                )}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleApply}
                  disabled={job.status !== 'ACTIVE'}
                >
                  {job.status === 'ACTIVE' ? 'Apply for this Job' : 'Applications Closed'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {job.applicationUrl && (
            <Card>
              <CardContent className="pt-0 p-0">
                <a
                  href={job.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 bg-primary-50 border border-primary-100 rounded-xl text-primary-700 text-center font-medium hover:bg-primary-100 transition-colors"
                >
                  <LinkIcon className="w-4 h-4 inline mr-2" /> Apply via External Link
                </a>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
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
