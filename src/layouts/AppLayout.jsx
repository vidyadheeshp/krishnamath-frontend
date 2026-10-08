import { useEffect, useState } from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import Logo from '../components/Logo';
import { navigationSections } from '../constants/navigation';
import { logout } from '../store/authSlice';
import i18n from '../i18n';

const initialsOf = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

const LANGUAGES = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'kn', label: 'ಕನ್ನಡ', name: 'ಕನ್ನಡ' },
];

function SidebarContent({ onNavigate }) {
  const user = useSelector((state) => state.auth.user);
  const { t } = useTranslation();

  const sections = navigationSections
    .map((section) => ({ ...section, items: section.items.filter((item) => item.roles.includes(user?.role)) }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-300">
      <div className="shrink-0 px-5 py-5">
        <Logo subtitle={t('nav.tagline')} />
      </div>

      <nav className="sidebar-scroll flex-1 space-y-6 overflow-y-auto px-3 pb-6 pt-2" aria-label="Main">
        {sections.map((section) => (
          <div key={section.key}>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t(section.key)}</p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                      isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                  <span className="truncate">{t(item.key)}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}

// Top bar: menu button + logo on small screens; language switch, signed-in user and sign out everywhere.
function Header({ onOpenMenu }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { t, i18n: i18nInstance } = useTranslation();
  const language = i18nInstance.language;

  const changeLanguage = (code) => {
    if (code === language) return;
    i18n.changeLanguage(code);
    localStorage.setItem('lang', code);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-8">
      <button
        type="button"
        onClick={onOpenMenu}
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="lg:hidden">
        <Logo size={32} tone="dark" showText={false} />
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5" role="group" aria-label={t('common.language')}>
          {LANGUAGES.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => changeLanguage(item.code)}
              aria-pressed={language === item.code}
              title={item.name}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                language === item.code ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-ink'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <span className="hidden h-6 w-px bg-slate-200 sm:block" aria-hidden="true" />

        <Link
          to="/profile"
          className="flex items-center gap-2.5 rounded-lg p-1 pr-2 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          title={t('profile.myProfile')}
          aria-label={t('profile.myProfile')}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
            {initialsOf(user?.name)}
          </span>
          <div className="hidden min-w-0 leading-tight md:block">
            <p className="max-w-[160px] truncate text-sm font-semibold text-ink">{user?.name}</p>
            <p className="max-w-[160px] truncate text-xs text-slate-500">{t(`roles.${user?.role}`, user?.role)}</p>
          </div>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          title={t('nav.signOut')}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{t('nav.signOut')}</span>
          <span className="sr-only sm:hidden">{t('nav.signOut')}</span>
        </button>
      </div>
    </header>
  );
}

export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-surface text-ink">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <SidebarContent />
      </aside>

      {drawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-xl">
            <SidebarContent onNavigate={() => setDrawerOpen(false)} />
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <Header onOpenMenu={() => setDrawerOpen(true)} />
        <main>
          <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
