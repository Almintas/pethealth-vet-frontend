import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { BrandMark } from '../components/BrandMark';
import { ADMIN_HOME, PLATFORM_ADMIN_ROLE } from '../features/admin/types';
import { useAuth } from '../features/auth';
import { SidebarUserMenu } from './SidebarUserMenu';
import './authenticated-layout.css';

type NavigationLabelKey =
  | 'navigation.dashboard'
  | 'navigation.patients'
  | 'navigation.appointments'
  | 'navigation.myClinic'
  | 'navigation.admin';

type NavItem =
  | { kind: 'divider' }
  | {
      kind: 'link';
      to: string;
      labelKey: NavigationLabelKey;
      end?: boolean;
      icon: ReactNode;
    }
  | {
      kind: 'placeholder';
      labelKey: NavigationLabelKey;
      icon: ReactNode;
    };

const navItems: NavItem[] = [
  {
    kind: 'link',
    to: '/dashboard',
    labelKey: 'navigation.dashboard',
    end: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
      </svg>
    ),
  },
  {
    kind: 'link',
    to: '/patients',
    labelKey: 'navigation.patients',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path d="M4.5 18c1.2-2.5 3.4-4 7.5-4s6.3 1.5 7.5 4" />
      </svg>
    ),
  },
  {
    kind: 'link',
    to: '/appointments',
    labelKey: 'navigation.appointments',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  { kind: 'divider' },
  {
    kind: 'link',
    to: '/clinics',
    labelKey: 'navigation.myClinic',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 21v-6h6v6" />
      </svg>
    ),
  },
];

/** Platform admins only see their admin tools (they have no clinical access). */
const adminNavItems: NavItem[] = [
  {
    kind: 'link',
    to: ADMIN_HOME,
    labelKey: 'navigation.admin',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
];

export function AuthenticatedLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const visibleNavItems = user?.role === PLATFORM_ADMIN_ROLE ? adminNavItems : navItems;
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      void navigate('/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="authenticated-layout">
      <header className="authenticated-layout__mobile-bar">
        <span className="authenticated-layout__mobile-brand">
          <BrandMark size="sm" />
          <span>PetHealth Vet</span>
        </span>
        <button
          type="button"
          className="authenticated-layout__mobile-toggle"
          aria-expanded={isMobileNavOpen}
          aria-controls="app-sidebar"
          onClick={() => setIsMobileNavOpen((open) => !open)}
        >
          <span className="authenticated-layout__mobile-toggle-icon" aria-hidden="true">
            <span className="authenticated-layout__mobile-toggle-bar" />
            <span className="authenticated-layout__mobile-toggle-bar" />
            <span className="authenticated-layout__mobile-toggle-bar" />
          </span>
          <span className="authenticated-layout__mobile-toggle-label">
            {t('common.menu')}
          </span>
        </button>
      </header>

      <aside
        id="app-sidebar"
        className={[
          'authenticated-layout__sidebar',
          isMobileNavOpen ? 'authenticated-layout__sidebar--open' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="authenticated-layout__brand">
          <BrandMark size="sm" />
          <div>
            <div className="authenticated-layout__brand-name">PetHealth Vet</div>
            <div className="authenticated-layout__brand-tagline">
              {t('common.brandTagline')}
            </div>
          </div>
        </div>

        <nav className="authenticated-layout__nav" aria-label={t('common.mainNav')}>
          {visibleNavItems.map((item, index) => {
            if (item.kind === 'divider') {
              return (
                <hr
                  key={`nav-divider-${index}`}
                  className="authenticated-layout__nav-divider"
                />
              );
            }

            if (item.kind === 'placeholder') {
              return (
                <span
                  key={item.labelKey}
                  className="authenticated-layout__link authenticated-layout__link--disabled"
                  aria-disabled="true"
                  title={t('common.comingSoon')}
                >
                  <span className="authenticated-layout__link-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="authenticated-layout__link-body">
                    <span className="authenticated-layout__link-label">
                      {t(item.labelKey)}
                    </span>
                    <span className="authenticated-layout__soon-badge">
                      {t('common.comingSoon')}
                    </span>
                  </span>
                </span>
              );
            }

            return (
              <NavLink
                key={item.to}
                className="authenticated-layout__link"
                to={item.to}
                end={item.end}
                onClick={() => setIsMobileNavOpen(false)}
              >
                <span className="authenticated-layout__link-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="authenticated-layout__link-body">
                  <span className="authenticated-layout__link-label">
                    {t(item.labelKey)}
                  </span>
                </span>
              </NavLink>
            );
          })}
        </nav>

        <div className="authenticated-layout__user">
          <SidebarUserMenu
            user={user}
            isLoggingOut={isLoggingOut}
            onLogout={handleLogout}
            onAfterAction={() => setIsMobileNavOpen(false)}
          />
        </div>
      </aside>

      {isMobileNavOpen ? (
        <button
          type="button"
          className="authenticated-layout__backdrop"
          aria-label={t('common.closeNavigation')}
          onClick={() => setIsMobileNavOpen(false)}
        />
      ) : null}

      <div className="authenticated-layout__main">
        <main className="authenticated-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
