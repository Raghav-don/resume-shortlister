import { useState, useRef, useEffect, Fragment } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

interface DropdownMenuItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  dangerous?: boolean;
  checked?: boolean;
}

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
  align?: 'left' | 'right';
}

export function DropdownMenu({ trigger, items, align = 'right' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <Fragment>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} aria-hidden="true" />
          <div
            className={cn(
              'fixed z-50 mt-1 min-w-[180px] bg-white rounded-lg border border-gray-200 shadow-lg py-1',
              align === 'right' ? 'right-0' : 'left-0'
            )}
            role="menu"
            aria-orientation="vertical"
          >
            {items.map((item, index) => (
              <button
                key={index}
                onClick={() => { item.onClick(); setIsOpen(false); }}
                disabled={item.disabled}
                className={cn(
                  'w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors',
                  item.disabled ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-900 hover:bg-gray-100',
                  item.dangerous && !item.disabled ? 'text-red-600 hover:bg-red-50' : ''
                )}
                role="menuitem"
                aria-disabled={item.disabled}
              >
                {item.icon && <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>}
                <span className="flex-1">{item.label}</span>
                {item.checked && <Check className="w-4 h-4 text-primary-600" />}
              </button>
            ))}
          </div>
        </Fragment>
      )}
    </div>
  );
}

interface UserMenuProps {
  user: { fullName: string; email: string };
  onProfileClick?: () => void;
  onLogout: () => void;
}

export function UserMenu({ user, onProfileClick, onLogout }: UserMenuProps) {
  return (
    <DropdownMenu
      trigger={
        <Button variant="ghost" size="sm" className="gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-sm font-medium text-primary-700">
              {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </span>
          </div>
          <span className="hidden sm:block text-sm font-medium text-gray-700">{user.fullName}</span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </Button>
      }
      items={[
        { label: 'Profile', onClick: onProfileClick || (() => {}), icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
        { label: 'Sign out', onClick: onLogout, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>, dangerous: true },
      ]}
      align="right"
    />
  );
}