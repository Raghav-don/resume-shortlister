import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { CandidateLayout } from './layouts/CandidateLayout';
import { RecruiterLayout } from './layouts/RecruiterLayout';
import { CandidateFormPage } from './pages/CandidateFormPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { CandidatesPage } from './pages/CandidatesPage';
import { CandidateDetailPage } from './pages/CandidateDetailPage';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner className="min-h-screen flex items-center justify-center" />;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner className="min-h-screen flex items-center justify-center" />;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

function CandidatePublicRoute({ children }: { children: React.ReactNode }) {
  return <CandidateLayout>{children}</CandidateLayout>;
}

function SuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
        <p className="text-gray-600">Thank you for applying. Our team will review your profile shortly.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public candidate submission - no auth required */}
      <Route path="/apply" element={<CandidatePublicRoute><CandidateFormPage /></CandidatePublicRoute>} />
      <Route path="/apply/success" element={<CandidatePublicRoute><SuccessPage /></CandidatePublicRoute>} />

      {/* Auth pages */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Recruiter protected routes */}
      <Route element={<ProtectedRoute><RecruiterLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/candidates" element={<CandidatesPage />} />
        <Route path="/candidates/:id" element={<CandidateDetailPage />} />
      </Route>

      {/* Redirect root */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}