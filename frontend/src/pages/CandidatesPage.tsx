import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Filter, X, ChevronDown, ChevronLeft, ChevronRight, CheckCircle, TrendingUp, Users } from 'lucide-react';
import { candidateApi, type Candidate, type CandidateFilters } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Modal, ConfirmDialog } from '../components/ui/Modal';
import { DropdownMenu } from '../components/ui/DropdownMenu';
import { PageLoading } from '../components/ui/LoadingSpinner';
import { formatCurrency, formatRelativeTime, cn, debounce } from '../lib/utils';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'NEW', label: 'New' },
  { value: 'SHORTLISTED', label: 'Shortlisted' },
  { value: 'REVIEWED', label: 'Partial Match' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'INTERVIEWING', label: 'Interviewing' },
  { value: 'HIRED', label: 'Hired' },
];

const REMOTE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'ON_SITE', label: 'On-site' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'REMOTE', label: 'Remote' },
];

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Applied' },
  { value: 'yearsOfExperience', label: 'Experience' },
  { value: 'salaryExpectation', label: 'Salary' },
  { value: 'fullName', label: 'Name' },
];

export function CandidatesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<{ candidate: Candidate; status: Candidate['status'] } | null>(null);

  // Parse initial filters from URL
  const initialFilters: CandidateFilters = useMemo(() => ({
    minExperience: searchParams.get('minExperience') ? parseInt(searchParams.get('minExperience')!) : undefined,
    maxExperience: searchParams.get('maxExperience') ? parseInt(searchParams.get('maxExperience')!) : undefined,
    skills: searchParams.get('skills') || undefined,
    location: searchParams.get('location') || undefined,
    remotePreference: searchParams.get('remotePreference') as CandidateFilters['remotePreference'] || undefined,
    noticePeriod: searchParams.get('noticePeriod') || undefined,
    maxSalary: searchParams.get('maxSalary') ? parseInt(searchParams.get('maxSalary')!) : undefined,
    status: searchParams.get('status') as CandidateFilters['status'] || undefined,
    page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 0,
    size: 20,
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortDir: (searchParams.get('sortDir') as 'asc' | 'desc') || 'desc',
  }), [searchParams]);

  const [filters, setFilters] = useState<CandidateFilters>(initialFilters);

  // Default values for pagination
  const currentPage = filters.page ?? 0;
  const pageSize = filters.size ?? 20;

  const fetchCandidates = debounce(async () => {
    setIsLoading(true);
    try {
      const response = await candidateApi.list(filters);
      setCandidates(response.data.content);
      setTotalElements(response.data.totalElements);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      toast.error('Failed to load candidates');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, 300);

  useEffect(() => {
    fetchCandidates();
  }, [filters]);

  const updateFilter = (key: keyof CandidateFilters, value: CandidateFilters[typeof key]) => {
    const newFilters = { ...filters, [key]: value, page: 0 };
    setFilters(newFilters);
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== null) params.set(k, String(v));
    });
    setSearchParams(params, { replace: true });
  };

  const clearFilters = () => {
    const cleared: CandidateFilters = { page: 0, size: 20, sortBy: 'createdAt', sortDir: 'desc' };
    setFilters(cleared);
    setSearchParams({ page: '0' }, { replace: true });
  };

  const hasActiveFilters = Object.entries(filters).some(([k, v]) =>
    k !== 'page' && k !== 'size' && k !== 'sortBy' && k !== 'sortDir' && v !== undefined && v !== ''
  );

  const handleStatusChange = (candidate: Candidate, newStatus: Candidate['status']) => {
    setStatusUpdate({ candidate, status: newStatus });
  };

  const confirmStatusChange = async () => {
    if (!statusUpdate) return;
    try {
      await candidateApi.updateStatus(statusUpdate.candidate.id, statusUpdate.status);
      toast.success(`Candidate marked as ${statusUpdate.status}`);
      fetchCandidates();
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setStatusUpdate(null);
    }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Experience (yrs)', 'Skills', 'Location', 'Remote', 'Notice Period', 'Salary', 'Status', 'Applied'];
    const rows = candidates.map(c => [
      c.fullName, c.email, c.phone || '', c.yearsOfExperience.toString(),
      c.technicalSkills.join('; '), c.location, c.remotePreference, c.noticePeriod,
      formatCurrency(c.salaryExpectation, c.currency), c.status, formatRelativeTime(c.createdAt)
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `candidates-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (isLoading) return <PageLoading />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
          <p className="text-gray-500 mt-1">{totalElements} candidate{totalElements !== 1 ? 's' : ''} found</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={exportCSV} disabled={candidates.length === 0}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button variant="secondary" onClick={() => setFiltersOpen(true)}>
            <Filter className="w-4 h-4" /> Filters
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      <Card className={cn(filtersOpen ? 'block' : 'hidden')}>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-4 p-4 border-b border-gray-100">
            <Input label="Skills (comma-separated)" placeholder="React, Node, Python" value={filters.skills || ''} onChange={(e) => updateFilter('skills', e.target.value)} className="w-64" />
            <Input label="Location" placeholder="San Francisco" value={filters.location || ''} onChange={(e) => updateFilter('location', e.target.value)} className="w-48" />
            <Select label="Remote" options={REMOTE_OPTIONS} value={filters.remotePreference || ''} onChange={(e) => updateFilter('remotePreference', e.target.value as CandidateFilters['remotePreference'])} className="w-40" />
            <Select label="Status" options={STATUS_OPTIONS} value={filters.status || ''} onChange={(e) => updateFilter('status', e.target.value as CandidateFilters['status'])} className="w-40" />
          </div>
          <div className="flex flex-wrap gap-4 p-4 border-b border-gray-100">
            <div className="grid gap-2 sm:grid-cols-2 w-48">
              <Input label="Min Exp" type="number" placeholder="0" min="0" max="50" value={filters.minExperience || ''} onChange={(e) => updateFilter('minExperience', e.target.value ? parseInt(e.target.value) : undefined)} />
              <Input label="Max Exp" type="number" placeholder="50" min="0" max="50" value={filters.maxExperience || ''} onChange={(e) => updateFilter('maxExperience', e.target.value ? parseInt(e.target.value) : undefined)} />
            </div>
            <Input label="Notice Period" placeholder="30 days" value={filters.noticePeriod || ''} onChange={(e) => updateFilter('noticePeriod', e.target.value)} className="w-40" />
            <Input label="Max Salary" type="number" placeholder="150000" min="0" step="1000" value={filters.maxSalary || ''} onChange={(e) => updateFilter('maxSalary', e.target.value ? parseInt(e.target.value) : undefined)} className="w-40" />
          </div>
          <div className="flex flex-wrap gap-4 p-4">
            <Select label="Sort By" options={SORT_OPTIONS.map(o => ({ value: o.value, label: o.label }))} value={filters.sortBy} onChange={(e) => updateFilter('sortBy', e.target.value)} className="w-40" />
            <Select label="Order" options={[{ value: 'asc', label: 'Ascending' }, { value: 'desc', label: 'Descending' }]} value={filters.sortDir} onChange={(e) => updateFilter('sortDir', e.target.value as 'asc' | 'desc')} className="w-40" />
            <Button variant="ghost" onClick={clearFilters} disabled={!hasActiveFilters} className="mt-8">
              <X className="w-4 h-4" /> Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardContent className="p-0">
          {candidates.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <h3 className="text-lg font-medium text-gray-900">No candidates found</h3>
              <p className="text-gray-500 mt-1">Try adjusting your filters or check back later</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead width="40">#</TableHead>
                    <TableHead>Candidate</TableHead>
                    <TableHead width="100">Exp</TableHead>
                    <TableHead>Skills</TableHead>
                    <TableHead width="150">Location</TableHead>
                    <TableHead width="120">Remote</TableHead>
                    <TableHead width="120">Notice</TableHead>
                    <TableHead width="120">Salary</TableHead>
                    <TableHead width="130">Status</TableHead>
                    <TableHead width="120">Applied</TableHead>
                    <TableHead width="100" className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.map((candidate, index) => (
                    <TableRow key={candidate.id} clickable onClick={() => setSelectedCandidate(candidate)}>
                      <TableCell className="text-gray-500">{(currentPage * pageSize) + index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{candidate.fullName}</p>
                          <p className="text-sm text-gray-500 truncate max-w-xs">{candidate.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">{candidate.yearsOfExperience} yrs</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {candidate.technicalSkills.slice(0, 4).map((skill) => (
                            <Badge key={skill} variant="primary" size="sm">{skill}</Badge>
                          ))}
                          {candidate.technicalSkills.length > 4 && (
                            <Badge variant="default" size="sm">+{candidate.technicalSkills.length - 4}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">{candidate.location}</TableCell>
                      <TableCell>
                        <Badge variant={candidate.remotePreference === 'REMOTE' ? 'success' : candidate.remotePreference === 'HYBRID' ? 'warning' : 'default'} size="sm">
                          {candidate.remotePreference.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">{candidate.noticePeriod}</TableCell>
                      <TableCell className="text-sm font-medium text-gray-900">{formatCurrency(candidate.salaryExpectation, candidate.currency)}</TableCell>
                      <TableCell><StatusBadge status={candidate.status} /></TableCell>
                      <TableCell className="text-sm text-gray-500">{formatRelativeTime(candidate.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu
                          trigger={<Button variant="ghost" size="sm" className="p-1"><ChevronDown className="w-4 h-4" /></Button>}
                          items={[
                            { label: 'View Details', onClick: () => setSelectedCandidate(candidate), icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> },
                            { label: 'Shortlist', onClick: () => handleStatusChange(candidate, 'SHORTLISTED'), disabled: candidate.status === 'SHORTLISTED', icon: <CheckCircle className="w-4 h-4" /> },
                            { label: 'Contact', onClick: () => handleStatusChange(candidate, 'CONTACTED'), disabled: candidate.status === 'CONTACTED', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
                            { label: 'Interview', onClick: () => handleStatusChange(candidate, 'INTERVIEWING'), disabled: candidate.status === 'INTERVIEWING', icon: <Users className="w-4 h-4" /> },
                            { label: 'Hire', onClick: () => handleStatusChange(candidate, 'HIRED'), disabled: candidate.status === 'HIRED', icon: <TrendingUp className="w-4 h-4" /> },
                            { label: 'Reject', onClick: () => handleStatusChange(candidate, 'REJECTED'), disabled: candidate.status === 'REJECTED', dangerous: true, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {currentPage + 1} of {totalPages} ({totalElements} total)
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => updateFilter('page', currentPage - 1)} disabled={currentPage === 0}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="secondary" size="sm" onClick={() => updateFilter('page', currentPage + 1)} disabled={currentPage >= totalPages - 1}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      {selectedCandidate && (
        <CandidateDetailModal candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} />
      )}

      {/* Status Confirmation Modal */}
      {statusUpdate && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setStatusUpdate(null)}
          onConfirm={confirmStatusChange}
          title={`Mark as ${statusUpdate.status}`}
          message={`Are you sure you want to mark ${statusUpdate.candidate.fullName} as ${statusUpdate.status}?`}
          confirmText="Yes, update"
          variant={statusUpdate.status === 'REJECTED' ? 'danger' : 'primary'}
        />
      )}
    </div>
  );
}

function CandidateDetailModal({ candidate, onClose }: { candidate: Candidate; onClose: () => void }) {
  return (
    <Modal isOpen={true} onClose={onClose} title={candidate.fullName} size="xl">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <div><dt className="text-gray-500">Email</dt><dd className="font-medium">{candidate.email}</dd></div>
              <div><dt className="text-gray-500">Phone</dt><dd className="font-medium">{candidate.phone || '—'}</dd></div>
              <div><dt className="text-gray-500">Location</dt><dd className="font-medium">{candidate.location}</dd></div>
              <div><dt className="text-gray-500">Work Preference</dt><dd className="font-medium"><Badge variant={candidate.remotePreference === 'REMOTE' ? 'success' : candidate.remotePreference === 'HYBRID' ? 'warning' : 'default'}>{candidate.remotePreference.replace('_', ' ')}</Badge></dd></div>
              <div><dt className="text-gray-500">Notice Period</dt><dd className="font-medium">{candidate.noticePeriod}</dd></div>
              <div><dt className="text-gray-500">Expected Salary</dt><dd className="font-medium">{formatCurrency(candidate.salaryExpectation, candidate.currency)}</dd></div>
            </dl>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Experience & Skills</h3>
            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <div><dt className="text-gray-500">Years of Experience</dt><dd className="font-medium">{candidate.yearsOfExperience} years</dd></div>
              <div className="sm:col-span-2">
                <dt className="text-gray-500">Technical Skills</dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {candidate.technicalSkills.map((skill) => (
                    <Badge key={skill} variant="primary">{skill}</Badge>
                  ))}
                </dd>
              </div>
            </dl>
          </div>

          {candidate.resumeUrl || candidate.portfolioUrl || candidate.linkedinUrl || candidate.githubUrl ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Links</h3>
              <div className="flex flex-wrap gap-3">
                {candidate.resumeUrl && <a href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline text-sm">Resume</a>}
                {candidate.portfolioUrl && <a href={candidate.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline text-sm">Portfolio</a>}
                {candidate.linkedinUrl && <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline text-sm">LinkedIn</a>}
                {candidate.githubUrl && <a href={candidate.githubUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline text-sm">GitHub</a>}
              </div>
            </div>
          ) : null}

          {candidate.recruiterNotes && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Recruiter Notes</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{candidate.recruiterNotes}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Status</span>
                  <StatusBadge status={candidate.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Applied</span>
                  <span className="font-medium">{formatRelativeTime(candidate.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Updated</span>
                  <span className="font-medium">{formatRelativeTime(candidate.updatedAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-0 p-0">
              <div className="grid grid-cols-2 gap-0">
                {[
                  { status: 'SHORTLISTED', label: 'Shortlist', variant: 'primary' as const },
                  { status: 'CONTACTED', label: 'Contact', variant: 'secondary' as const },
                  { status: 'INTERVIEWING', label: 'Interview', variant: 'secondary' as const },
                  { status: 'HIRED', label: 'Hire', variant: 'success' as const },
                  { status: 'REJECTED', label: 'Reject', variant: 'danger' as const },
                ].map(({ status, label, variant }) => (
                  <Button
                    key={status}
                    variant={variant}
                    className="h-12 px-2"
                    disabled={candidate.status === status}
                    onClick={() => { onClose(); setTimeout(() => window.dispatchEvent(new CustomEvent('status-change', { detail: { candidate, status } })), 0); }}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Modal>
  );
}
