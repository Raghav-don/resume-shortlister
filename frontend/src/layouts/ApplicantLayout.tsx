import { type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FileText, Briefcase } from 'lucide-react';
import { cn } from '../lib/utils';
import { UserMenu } from '../components/ui/DropdownMenu';
import { useAuth } from '../context/AuthContext';

const navigation = [
  { name: 'Jobs', href: '/jobs/applicant', icon: Briefcase },
  { name: 'My Applications', href: '/my-applications', icon: FileText },
];

export function ApplicantLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">Resume Shortlister</span>
            </div>
            <nav className="flex items-center gap-6">
              {navigation.map((item) => {
                const Icon = item.icon as React.ComponentType<any>;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) => cn(
                      'text-sm font-medium transition-colors',
                      isActive
                        ? 'text-primary-600'
                        : 'text-gray-600 hover:text-primary-600'
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    {item.name}
                  </NavLink>
                );
              })}
              <UserMenu user={user!} onLogout={handleLogout} />
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">&copy; 2024 Resume Shortlister. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
