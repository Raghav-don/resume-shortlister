import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { CandidateLayout } from './layouts/CandidateLayout';
import { RecruiterLayout } from './layouts/RecruiterLayout';
import { ApplicantLayout } from './layouts/ApplicantLayout';
import { CandidateFormPage } from './pages/CandidateFormPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { CandidatesPage } from './pages/CandidatesPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { CandidateDetailPage } from './pages/CandidateDetailPage';
import { JobsPage } from './pages/JobsPage';
import { JobFormPage } from './pages/JobFormPage';
import { ApplicantJobsPage } from './pages/ApplicantJobsPage';
import { JobDetailPage } from './pages/JobDetailPage';
import { JobApplicationFormPage } from './pages/JobApplicationFormPage';
import { MyApplicationsPage } from './pages/MyApplicationsPage';
import { MyApplicationDetailPage } from './pages/MyApplicationDetailPage';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

function RecruiterAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner className="min-h-screen flex items-center justify-center" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const roles = user?.roles || [];
  if (!roles.includes('RECRUITER') && !roles.includes('ADMIN')) {
    return <Navigate to={roles.includes('APPLICANT') ? '/jobs/applicant' : '/dashboard'} replace />;
  }
  return <RecruiterLayout>{children}</RecruiterLayout>;
}

function ApplicantAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner className="min-h-screen flex items-center justify-center" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const roles = user?.roles || [];
  if (!roles.includes('APPLICANT')) {
    return <Navigate to="/dashboard" replace />;
  }
  return <ApplicantLayout>{children}</ApplicantLayout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner className="min-h-screen flex items-center justify-center" />;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

function CandidatePublicRoute({ children }: { children: React.ReactNode }) {
  return <CandidateLayout>{children}</CandidateLayout>;
}

export default function App() {
  return (
    <Routes>
      {/* Public candidate submission - no auth required */}
      <Route path="/apply" element={<CandidatePublicRoute><CandidateFormPage /></CandidatePublicRoute>} />
      <Route path="/apply/success" element={<CandidatePublicRoute><div className="min-h-screen flex items-center justify-center p-4"><div className="text-center"><h1 className="text-3xl font-bold text-gray-900 mb-2">Application Submitted!</h1><p className="text-gray-600">Thank you for applying. Our team will review your profile shortly.</p></div></div></CandidatePublicRoute>} />

      {/* Auth pages */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Recruiter/HR protected routes */}
      <Route path="/dashboard" element={<RecruiterAuthGuard><DashboardPage /></RecruiterAuthGuard>} />
      <Route path="/candidates" element={<RecruiterAuthGuard><CandidatesPage /></RecruiterAuthGuard>} />
      <Route path="/applications" element={<RecruiterAuthGuard><ApplicationsPage /></RecruiterAuthGuard>} />
      <Route path="/candidates/:id" element={<RecruiterAuthGuard><CandidateDetailPage /></RecruiterAuthGuard>} />
      <Route path="/jobs" element={<RecruiterAuthGuard><JobsPage /></RecruiterAuthGuard>} />
      <Route path="/jobs/post" element={<RecruiterAuthGuard><JobFormPage /></RecruiterAuthGuard>} />
      <Route path="/jobs/post/:id" element={<RecruiterAuthGuard><JobFormPage /></RecruiterAuthGuard>} />

      {/* Applicant protected routes */}
      <Route path="/jobs/applicant" element={<ApplicantAuthGuard><ApplicantJobsPage /></ApplicantAuthGuard>} />
      <Route path="/jobs/applicant/:id/view" element={<ApplicantAuthGuard><JobDetailPage /></ApplicantAuthGuard>} />
      <Route path="/jobs/applicant/:id/apply" element={<ApplicantAuthGuard><JobApplicationFormPage /></ApplicantAuthGuard>} />
      <Route path="/my-applications" element={<ApplicantAuthGuard><MyApplicationsPage /></ApplicantAuthGuard>} />
      <Route path="/my-applications/:id" element={<ApplicantAuthGuard><MyApplicationDetailPage /></ApplicantAuthGuard>} />

      {/* Redirect root */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
