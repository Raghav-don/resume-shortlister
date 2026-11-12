import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { jobApplicationApi, type JobApplicationResponse, type ApplicationStatus } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { PageLoading } from '../components/ui/LoadingSpinner';
import { formatRelativeTime } from '../lib/utils';
import toast from 'react-hot-toast';
import { Clock, Mail, Globe, Link as LinkIcon, Github, Upload, FileText, ArrowLeft } from 'lucide-react';

const STATUS_VARIANTS: Record<ApplicationStatus, 'default' | 'success' | 'warning' | 'danger' | 'primary'> = {
  PENDING: 'warning',
  REVIEWED: 'default',
  SHORTLISTED: 'success',
  REJECTED: 'danger',
  HIRED: 'primary',
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING: 'Pending',
  REVIEWED: 'Reviewed',
  SHORTLISTED: 'Shortlisted',
  REJECTED: 'Rejected',
  HIRED: 'Hired',
};

export function MyApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<JobApplicationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchApplication = async () => {
      try {
        const response = await jobApplicationApi.get(id);
        setApplication(response.data);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to load application');
        navigate('/my-applications');
      } finally {
        setIsLoading(false);
      }
    };
    fetchApplication();
  }, [id, navigate]);

  if (isLoading) return <PageLoading />;
  if (!application) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/my-applications" className="text-sm text-primary-600 hover:text-primary-700">
          <ArrowLeft className="w-4 h-4" /> Back to Applications
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>{application.jobTitle || 'Job Application'}</CardTitle>
                <p className="text-sm text-gray-500">Application #{application.id.slice(0, 8)}</p>
              </div>
              <Badge variant={STATUS_VARIANTS[application.status]} size="md">
                {STATUS_LABELS[application.status]}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary-600" /> Contact Information
                  </h3>
                  <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                    <div>
                      <dt className="text-gray-500">Full Name</dt>
                      <dd className="font-medium">{application.fullName}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Email</dt>
                      <dd className="font-medium">{application.email}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Phone</dt>
                      <dd className="font-medium">{application.phone || 'Not provided'}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Current Location</dt>
                      <dd className="font-medium">{application.currentLocation}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Work Authorization</dt>
                      <dd className="font-medium">{application.workAuthorization || 'Not specified'}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-gray-500">Years of Experience</dt>
                      <dd className="font-medium">{application.yearsOfExperience} years</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-gray-500">Notice Period</dt>
                      <dd className="font-medium">{application.noticePeriod}</dd>
                    </div>
                  </dl>
                </div>

                {(application.resumeUrl || application.portfolioUrl || application.linkedinUrl || application.githubUrl) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <LinkIcon className="w-5 h-5 text-primary-600" /> Profile Links
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {application.resumeUrl && (
                        <a href={application.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline text-sm flex items-center gap-1">
                          <Upload className="w-4 h-4" /> Resume
                        </a>
                      )}
                      {application.portfolioUrl && (
                        <a href={application.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline text-sm flex items-center gap-1">
                          <Globe className="w-4 h-4" /> Portfolio
                        </a>
                      )}
                      {application.linkedinUrl && (
                        <a href={application.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline text-sm flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> LinkedIn
                        </a>
                      )}
                      {application.githubUrl && (
                        <a href={application.githubUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline text-sm flex items-center gap-1">
                          <Github className="w-4 h-4" /> GitHub
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {application.coverLetter && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary-600" /> Cover Letter
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{application.coverLetter}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">Application Submitted</span>
                      <span className="text-xs text-gray-500">{formatRelativeTime(application.appliedAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600 ml-10">Your application was received.</p>
                  </div>
                </div>
                {(application.status !== 'PENDING') && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">Status Updated</span>
                        <span className="text-xs text-gray-500">{formatRelativeTime(application.updatedAt)}</span>
                      </div>
                      <p className="text-sm text-gray-600 ml-10">Application status changed to {STATUS_LABELS[application.status]}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card variant="elevated">
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Application Status</span>
                  <Badge variant={STATUS_VARIANTS[application.status]}>
                    {STATUS_LABELS[application.status]}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Applied At</span>
                  <span className="font-medium text-sm">{formatRelativeTime(application.appliedAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Last Updated</span>
                  <span className="font-medium text-sm">{formatRelativeTime(application.updatedAt)}</span>
                </div>
              </div>
              {application.status === 'PENDING' && (
                <div className="pt-4 border-t border-gray-100">
                  <Button variant="ghost" onClick={() => navigate(`/jobs/applicant/${application.jobId}/view`)} className="w-full">
                    View Job Details
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
