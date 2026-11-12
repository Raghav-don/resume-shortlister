import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { jobApi, type Job, type JobStatus } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Input';
import { Briefcase, Clock, MapPin, DollarSign, GraduationCap, Plus, Eye } from 'lucide-react';
import { PageLoading } from '../components/ui/LoadingSpinner';
import { formatCurrency, formatExperience } from '../lib/utils';
import toast from 'react-hot-toast';

const STATUS_LABELS: Record<JobStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  CLOSED: 'Closed',
  ARCHIVED: 'Archived',
};

const STATUS_VARIANTS: Record<JobStatus, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary'> = {
  DRAFT: 'default',
  ACTIVE: 'success',
  CLOSED: 'warning',
  ARCHIVED: 'danger',
};

const CANDIDATE_LEVEL_LABELS: Record<string, string> = {
  FRESHER: 'Fresher',
  EXPERIENCED: 'Experienced',
  BOTH: 'Both',
};

export function ApplicantJobsPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    title: '',
    workMode: '' as string,
    candidateLevel: '' as string,
  });

  const loadJobs = async () => {
    try {
      const response = await jobApi.list({
        status: 'ACTIVE',
        page: 0,
        size: 100,
        sortBy: 'createdAt',
        sortDir: 'desc',
      });
      setJobs(response.data.content);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const filteredJobs = jobs.filter((job) => {
    const matchTitle = job.title.toLowerCase().includes(filters.title.toLowerCase());
    const matchWorkMode = !filters.workMode || job.workMode === filters.workMode;
    const matchLevel = !filters.candidateLevel || job.candidateLevel === filters.candidateLevel;
    return matchTitle && matchWorkMode && matchLevel;
  });

  const handleApply = (jobId: string) => {
    navigate(`/jobs/applicant/${jobId}/apply`);
  };

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Available Jobs</h1>
          <p className="text-gray-500 mt-1">Browse open positions and apply to roles that match your skills.</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200">
        <CardContent className="p-4 grid gap-4 sm:grid-cols-4 items-end">
          <div className="col-span-full sm:col-span-2 lg:col-span-2">
            <Input
              label="Search by title"
              value={filters.title}
              onChange={(e) => setFilters((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Search job titles..."
            />
          </div>
          <div className="sm:col-span-1 lg:col-span-1">
            <Select
              label="Work Mode"
              options={[
                { value: '', label: 'All' },
                { value: 'REMOTE', label: 'Remote' },
                { value: 'HYBRID', label: 'Hybrid' },
                { value: 'ON_SITE', label: 'On-site' },
              ]}
              value={filters.workMode}
              onChange={(e) => setFilters((prev) => ({ ...prev, workMode: e.target.value }))}
              placeholder="All"
            />
          </div>
          <div className="sm:col-span-1 lg:col-span-1">
            <Select
              label="Candidate Level"
              options={[
                { value: '', label: 'All' },
                { value: 'FRESHER', label: 'Fresher' },
                { value: 'EXPERIENCED', label: 'Experienced' },
                { value: 'BOTH', label: 'Both' },
              ]}
              value={filters.candidateLevel}
              onChange={(e) => setFilters((prev) => ({ ...prev, candidateLevel: e.target.value }))}
              placeholder="All"
            />
          </div>
        </CardContent>
      </Card>

      {/* Jobs Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredJobs.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No jobs found</h3>
            <p className="text-gray-500 mt-1">No active job postings match your filters.</p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <Card key={job.id} variant="elevated" className="hover:shadow-md transition-shadow group">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{job.title}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {job.department || 'Engineering'} • {job.employmentType}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANTS[job.status]} size="sm">
                    {STATUS_LABELS[job.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{job.officeLocation || job.workMode}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Clock className="w-4 h-4" />
                    <span>{formatExperience(job)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <GraduationCap className="w-4 h-4" />
                    <span>{CANDIDATE_LEVEL_LABELS[job.candidateLevel]}</span>
                  </div>
                  {(job.salaryMin || job.salaryMax) && !job.hideSalary && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <DollarSign className="w-4 h-4" />
                      <span>
                        {job.salaryMin && job.salaryMax
                          ? `${formatCurrency(job.salaryMin, job.salaryCurrency)} - ${formatCurrency(job.salaryMax, job.salaryCurrency)}`
                          : job.salaryMin
                            ? `${formatCurrency(job.salaryMin, job.salaryCurrency)}+`
                            : job.salaryMax
                              ? `Up to ${formatCurrency(job.salaryMax, job.salaryCurrency)}`
                              : 'Not specified'}
                        {' '}
                        {job.salaryPeriod === 'MONTHLY' ? 'per month' : 'per year'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Preferred Skills</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {job.preferredTechnicalSkills.slice(0, 5).map((skill) => (
                      <Badge key={skill} variant="primary" size="sm">{skill}</Badge>
                    ))}
                    {job.preferredTechnicalSkills.length > 5 && (
                      <Badge variant="default" size="sm">+{job.preferredTechnicalSkills.length - 5}</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
              <div className="pt-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <Link to={`/jobs/applicant/${job.id}/view`}>
                    <Button variant="ghost" size="sm" className="flex-1">
                      <Eye className="w-4 h-4" /> View Details
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleApply(job.id)}
                  >
                    <Plus className="w-4 h-4" /> Apply
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {filteredJobs.length > 0 && (
        <div className="text-center pt-4">
          <p className="text-sm text-gray-500">
            {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} available
          </p>
        </div>
      )}
    </div>
  );
}
