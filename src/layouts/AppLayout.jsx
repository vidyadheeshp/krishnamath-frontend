import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { navigationItems } from '../constants/navigation';
import { logout } from '../store/authSlice';
import i18n from '../i18n';

export default function AppLayout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { t, i18n: i18nInstance } = useTranslation();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const toggleLanguage = () => {
    const next = i18nInstance.language === 'en' ? 'kn' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('lang', next);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(242,184,75,0.5),_transparent_34%),linear-gradient(180deg,_#f8f1e4_0%,_#f4ead8_100%)] text-ink">
      <div className="mx-auto grid min-h-screen max-w-[1600px] gap-6 overflow-x-hidden px-4 py-6 lg:grid-cols-[220px_1fr] lg:px-6">
        <aside className="rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-card backdrop-blur">
          <div className="rounded-[1.5rem] bg-gradient-to-br from-terracotta to-teak p-4 text-white">
            <p className="text-xs uppercase tracking-[0.4em] text-white/70">Temple seva</p>
            <h1 className="mt-2 font-serif text-2xl">Krishnamath</h1>
            <p className="mt-2 text-xs text-white/80">Operations, receipts, reporting, and calendar bookings.</p>
          </div>
          <nav className="mt-6 space-y-2">
            {navigationItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive ? 'bg-ink text-white' : 'text-teak hover:bg-sandal/70'
                  }`
                }
              >
                <span>{t(item.key)}</span>
                <span>→</span>
              </NavLink>
            ))}
          </nav>
          <div className="mt-6 rounded-[1.5rem] border border-sandal bg-sandal/50 p-4 text-sm text-teak">
            <p className="font-semibold text-ink">{t('nav.signedInAs')}</p>
            <p className="mt-1">{user?.name}</p>
            <p className="text-xs uppercase tracking-[0.2em] text-teak/70">{user?.role}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 w-full rounded-2xl bg-teak px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink"
          >
            {t('nav.signOut')}
          </button>
          <button
            type="button"
            onClick={toggleLanguage}
            className="mt-3 w-full rounded-2xl border border-sandal bg-sandal/30 px-4 py-2.5 text-sm font-medium text-teak transition hover:bg-sandal/60"
          >
            {i18nInstance.language === 'en' ? 'ಕನ್ನಡ' : 'English'}
          </button>
        </aside>
        <main className="space-y-6 py-2">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
