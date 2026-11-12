import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Download,
  Filter,
  X,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  MapPin,
  FileText,
} from 'lucide-react';
import {
  jobApi,
  jobApplicationApi,
  type Job,
  type JobApplicationResponse,
  type ApplicationStatus,
} from '../lib/api';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Modal, ConfirmDialog } from '../components/ui/Modal';
import { DropdownMenu } from '../components/ui/DropdownMenu';
import { PageLoading } from '../components/ui/LoadingSpinner';
import { formatCurrency, formatRelativeTime, cn, debounce } from '../lib/utils';
import toast from 'react-hot-toast';

const APP_STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'New' },
  { value: 'SHORTLISTED', label: 'Shortlisted' },
  { value: 'REVIEWED', label: 'Partial Match' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'HIRED', label: 'Hired' },
];

const APP_STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING: 'New',
  REVIEWED: 'Partial Match',
  SHORTLISTED: 'Shortlisted',
  REJECTED: 'Rejected',
  HIRED: 'Hired',
};

const APP_STATUS_ACTIONS: ApplicationStatus[] = ['PENDING', 'REVIEWED', 'SHORTLISTED', 'REJECTED', 'HIRED'];

function appStatusLabel(status: ApplicationStatus) {
  return APP_STATUS_LABELS[status] || status;
}

// ApplicationStatus -> Candidate['status'] (for StatusBadge display)
function badgeStatusFor(appStatus: ApplicationStatus) {
  switch (appStatus) {
    case 'PENDING': return 'NEW';
    case 'SHORTLISTED': return 'SHORTLISTED';
    case 'REVIEWED': return 'REVIEWED';
    case 'REJECTED': return 'REJECTED';
    case 'HIRED': return 'HIRED';
  }
}

export function ApplicationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = (searchParams.get('status') as ApplicationStatus | '') || '';
  const jobId = searchParams.get('jobId') || undefined;

  // Overview state (jobs + counts)
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobAppCounts, setJobAppCounts] = useState<Record<string, number>>({});
  // Per-job state
  const [applications, setApplications] = useState<JobApplicationResponse[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<JobApplicationResponse | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<{ application: JobApplicationResponse; status: ApplicationStatus } | null>(null);

  // Fetch jobs + application counts per job (overview mode)
  useEffect(() => {
    if (jobId) return;
    const fetchOverview = debounce(async () => {
      setIsLoading(true);
      try {
        const jobsRes = await jobApi.myJobs();
        const jobList: Job[] = Array.isArray(jobsRes) ? jobsRes : jobsRes.data || [];
        setJobs(jobList);

        const counts: Record<string, number> = {};
        await Promise.all(
          jobList.map(async (job) => {
            try {
              const res = await jobApplicationApi.byJob(job.id, 0, 1000);
              const apps: JobApplicationResponse[] = res.data.content;
              counts[job.id] = statusFilter ? apps.filter((a) => a.status === statusFilter).length : apps.length;
            } catch (e) {
              counts[job.id] = 0;
            }
          })
        );
        setJobAppCounts(counts);
      } catch (error) {
        toast.error('Failed to load jobs');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }, 300);
    fetchOverview();
  }, [jobId, statusFilter]);

  // Fetch applications for the selected job (per-job mode)
  useEffect(() => {
    if (!jobId) return;
    const fetchApps = debounce(async () => {
      setIsLoading(true);
      setSelectedJob(null);
      try {
        const [jobRes, appsRes] = await Promise.all([
          jobApi.get(jobId),
          jobApplicationApi.byJob(jobId, 0, 1000),
        ]);
        const job: Job = jobRes.data;
        let apps: JobApplicationResponse[] = appsRes.data.content;
        if (statusFilter) {
          apps = apps.filter((a) => a.status === statusFilter);
        }
        // Sort newest first
        apps.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
        setSelectedJob(job);
        setApplications(apps);
      } catch (error) {
        toast.error('Failed to load applications');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }, 300);
    fetchApps();
  }, [jobId, statusFilter]);

  const handleJobClick = (id: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('jobId', id);
    setSearchParams(params, { replace: true });
  };

  const handleBackToJobs = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('jobId');
    setSearchParams(params, { replace: true });
  };

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === '' || value === undefined) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete('jobId');
    setSearchParams(params, { replace: true });
  };

  const clearFilters = () => {
    setSearchParams({}, { replace: true });
  };

  const handleStatusChange = (application: JobApplicationResponse, newStatus: ApplicationStatus) => {
    setStatusUpdate({ application, status: newStatus });
  };

  const confirmStatusChange = async () => {
    if (!statusUpdate) return;
    try {
      await jobApplicationApi.updateStatus(statusUpdate.application.id, statusUpdate.status);
      toast.success(`Application marked as ${appStatusLabel(statusUpdate.status)}`);
      if (jobId) {
        const res = await jobApplicationApi.byJob(jobId, 0, 1000);
        let apps: JobApplicationResponse[] = res.data.content;
        if (statusFilter) {
          apps = apps.filter((a) => a.status === statusFilter);
        }
        apps.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
        setApplications(apps);
      } else {
        const counts = { ...jobAppCounts };
        try {
          const res = await jobApplicationApi.byJob(statusUpdate.application.jobId, 0, 1000);
          const apps: JobApplicationResponse[] = res.data.content;
          counts[statusUpdate.application.jobId] = statusFilter
            ? apps.filter((a) => a.status === statusFilter).length
            : apps.length;
        } catch (e) {
          counts[statusUpdate.application.jobId] = 0;
        }
        setJobAppCounts(counts);
      }
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setStatusUpdate(null);
    }
  };

  const exportCSV = () => {
    if (jobId) {
      const headers = ['Candidate', 'Email', 'Experience (yrs)', 'Skills', 'Location', 'Salary', 'Status', 'Applied'];
      const rows = applications.map((a) => [
        a.fullName,
        a.email,
        a.yearsOfExperience.toString(),
        (a.technicalSkills || []).join('; '),
        a.currentLocation,
        formatCurrency(a.salaryExpectation || 0, a.currency || 'INR'),
        appStatusLabel(a.status),
        formatRelativeTime(a.appliedAt),
      ]);
      const csv = [headers, ...rows]
        .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `applications-${selectedJob?.title || 'job'}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } else {
      const headers = ['Job Title', 'Department', 'Location', 'Work Mode', 'Level', 'Applications'];
      const rows = jobs.map((j) => [
        j.title,
        j.department || '',
        j.officeLocation || '',
        j.workMode.replace('_', ' '),
        j.candidateLevel,
        jobAppCounts[j.id] || 0,
      ]);
      const csv = [headers, ...rows]
        .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `jobs-application-counts-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    }
  };

  if (isLoading) return <PageLoading />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {jobId ? 'Applications' : 'Applications by Job Role'}
          </h1>
          <p className="text-gray-500 mt-1">
            {jobId
              ? `Viewing applicants for “${selectedJob?.title}” (${applications.length})`
              : `Select a job role to view its applicants. Current filter: <strong>${statusFilter ? appStatusLabel(statusFilter) : 'All statuses'}</strong>`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {jobId && (
            <Button variant="ghost" size="sm" onClick={handleBackToJobs}>
              <ArrowLeft className="w-3 h-3 mr-1" /> Back to Jobs
            </Button>
          )}
          <Button variant="secondary" onClick={() => setFiltersOpen(true)}>
            <Filter className="w-4 h-4" /> Filters
          </Button>
          <Button variant="secondary" onClick={exportCSV} disabled={!jobId && jobs.length === 0}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      <Card className={cn(filtersOpen ? 'block' : 'hidden')}>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-4 p-4 border-b border-gray-100">
            <Select
              label="Status"
              options={APP_STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="w-48"
            />
          </div>
          <div className="flex flex-wrap gap-4 p-4">
            <Button variant="ghost" onClick={clearFilters} disabled={statusFilter === '' && !jobId} className="mt-8">
              <X className="w-4 h-4" /> Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {jobId ? (
        // Per-job applications view
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {selectedJob?.title || 'Applications'}
              </h2>
              <p className="text-gray-500 text-sm">
                {selectedJob?.department || 'General'} ·{' '}
                {selectedJob?.workMode.replace('_', ' ')} ·{' '}
                {selectedJob?.candidateLevel}
              </p>
            </div>
            <Badge variant="default" size="sm">
              {applications.length} application{applications.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead width="100">Exp</TableHead>
                  <TableHead>Skills</TableHead>
                  <TableHead width="150">Location</TableHead>
                  <TableHead width="120">Salary</TableHead>
                  <TableHead width="130">Status</TableHead>
                  <TableHead width="120">Applied</TableHead>
                  <TableHead width="120" className="text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No applicants found for {appStatusLabel(statusFilter || 'PENDING')} status.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{app.fullName}</p>
                          <p className="text-sm text-gray-500 truncate max-w-xs">{app.email}</p>
                          {app.resumeUrl && (
                            <a
                              href={app.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary-600 hover:underline mt-1 flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3" /> View Resume
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">
                        {app.yearsOfExperience} yrs
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(app.technicalSkills || [])
                            .slice(0, 4)
                            .map((skill) => (
                              <Badge key={skill} variant="primary" size="sm">
                                {skill}
                              </Badge>
                            ))}
                          {(app.technicalSkills || []).length > 4 && (
                            <Badge variant="default" size="sm">
                              +{(app.technicalSkills || []).length - 4}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">{app.currentLocation}</TableCell>
                      <TableCell className="text-sm font-medium text-gray-900">
                        {formatCurrency(app.salaryExpectation || 0, app.currency || 'INR')}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={badgeStatusFor(app.status)} />
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatRelativeTime(app.appliedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu
                          trigger={
                            <Button variant="ghost" size="sm" className="p-1">
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          }
                          items={[
                            {
                              label: 'View Details',
                              onClick: () => setSelectedApp(app),
                              icon: (
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                              ),
                            },
                            ...APP_STATUS_ACTIONS.map((s) => ({
                              label: appStatusLabel(s),
                              onClick: () => handleStatusChange(app, s),
                              disabled: app.status === s,
                            })),
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        // Jobs overview view
        <>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="default" size="sm">
              Status: {statusFilter ? appStatusLabel(statusFilter) : 'All statuses'}
            </Badge>
          </div>

          {jobs.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No job roles found</h3>
              <p className="text-gray-500 mt-1">
                There are no job roles to display. Post a job to start receiving applications.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {jobs.map((job) => (
                <Card
                  key={job.id}
                  className="hover:shadow-md transition-shadow border group"
                  onClick={() => handleJobClick(job.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 leading-snug">{job.title}</h3>
                      <span
                        className="text-xs font-medium bg-primary-50 text-primary-700 px-2.5 py-1 rounded-md"
                      >
                        {jobAppCounts[job.id] || 0} applicants
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {job.department || 'General'}
                    </p>
                    <div className="space-y-1 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        {job.officeLocation || '—'}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {job.workMode.replace('_', ' ')}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {job.candidateLevel}
                      </div>
                    </div>
                    {job.salaryMin != null && job.salaryMax != null && (
                      <div className="text-sm font-medium text-gray-900 mb-4">
                        {formatCurrency(
                          job.salaryMin,
                          job.salaryCurrency || 'INR'
                        )} - {formatCurrency(job.salaryMax, job.salaryCurrency || 'INR')}
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJobClick(job.id);
                      }}
                    >
                      View Applications <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Application Detail Modal */}
      {selectedApp && (
        <Modal isOpen={true} onClose={() => setSelectedApp(null)} title={selectedApp.fullName} size="xl">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                  <div>
                    <dt className="text-gray-500">Email</dt>
                    <dd className="font-medium">{selectedApp.email}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Phone</dt>
                    <dd className="font-medium">{selectedApp.phone || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Location</dt>
                    <dd className="font-medium">{selectedApp.currentLocation}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Work Preference</dt>
                    <dd className="font-medium">
                      {selectedApp.remotePreference
                        ? selectedApp.remotePreference.replace('_', ' ')
                        : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Notice Period</dt>
                    <dd className="font-medium">{selectedApp.noticePeriod}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Expected Salary</dt>
                    <dd className="font-medium">
                      {formatCurrency(
                        selectedApp.salaryExpectation || 0,
                        selectedApp.currency || 'INR'
                      )}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Experience & Skills</h3>
                <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                  <div>
                    <dt className="text-gray-500">Years of Experience</dt>
                    <dd className="font-medium">
                      {selectedApp.yearsOfExperience} years
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-gray-500">Technical Skills</dt>
                    <dd className="mt-2 flex flex-wrap gap-2">
                      {(selectedApp.technicalSkills || []).map((skill) => (
                        <Badge key={skill} variant="primary">{skill}</Badge>
                      ))}
                    </dd>
                  </div>
                </dl>
              </div>

              {selectedApp.resumeUrl || selectedApp.portfolioUrl || selectedApp.linkedinUrl || selectedApp.githubUrl ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Links</h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedApp.resumeUrl && (
                      <a
                        href={selectedApp.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline text-sm"
                      >
                        Resume
                      </a>
                    )}
                    {selectedApp.portfolioUrl && (
                      <a
                        href={selectedApp.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline text-sm"
                      >
                        Portfolio
                      </a>
                    )}
                    {selectedApp.linkedinUrl && (
                      <a
                        href={selectedApp.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline text-sm"
                      >
                        LinkedIn
                      </a>
                    )}
                    {selectedApp.githubUrl && (
                      <a
                        href={selectedApp.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline text-sm"
                      >
                        GitHub
                      </a>
                    )}
                  </div>
                </div>
              ) : null}

              {selectedApp.coverLetter && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Cover Letter</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedApp.coverLetter}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Card>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Status</span>
                      <StatusBadge status={badgeStatusFor(selectedApp.status)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Job</span>
                      <span className="font-medium">{selectedApp.jobTitle || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Applied</span>
                      <span className="font-medium">{formatRelativeTime(selectedApp.appliedAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Last Updated</span>
                      <span className="font-medium">{formatRelativeTime(selectedApp.updatedAt)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-0 p-0">
                  <div className="grid grid-cols-2 gap-0">
                    {APP_STATUS_ACTIONS.map((s) => (
                      <Button
                        key={s}
                        variant={
                          s === 'REJECTED'
                            ? 'danger'
                            : s === 'HIRED'
                              ? 'primary'
                              : 'secondary'
                        }
                        className="h-12 px-2"
                        disabled={selectedApp.status === s}
                        onClick={() => handleStatusChange(selectedApp, s)}
                      >
                        {appStatusLabel(s)}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Modal>
      )}

      {/* Status Confirmation Modal */}
      {statusUpdate && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setStatusUpdate(null)}
          onConfirm={confirmStatusChange}
          title={`Mark as ${appStatusLabel(statusUpdate.status)}`}
          message={`Are you sure you want to mark ${statusUpdate.application.fullName} as ${appStatusLabel(statusUpdate.status)}?`}
          confirmText="Yes, update"
          variant={statusUpdate.status === 'REJECTED' ? 'danger' : 'primary'}
        />
      )}
    </div>
  );
}
