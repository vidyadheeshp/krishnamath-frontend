import { KeyRound, Save, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import api from '../api/client';
import PageHeader from '../components/PageHeader';
import { profileUpdated } from '../store/authSlice';

const inputClass =
  'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-slate-50 disabled:text-slate-500';
const primaryButton =
  'inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50';

const MIN_PASSWORD_LENGTH = 10;

function Card({ icon: Icon, title, description, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-brand">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const sessionUser = useSelector((state) => state.auth.user);

  const [profile, setProfile] = useState(null); // what is saved on the server
  const [form, setForm] = useState({ name: '', email: '', phone: '', currentPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    api
      .get('/auth/me')
      .then((response) => {
        const data = response.data.data;
        setProfile(data);
        setForm({ name: data.name, email: data.email, phone: data.phone || '', currentPassword: '' });
      })
      .catch((error) => toast.error(error.response?.data?.message || t('profile.loadFailed')));
  }, [t]);

  const emailChanged = profile ? form.email.trim().toLowerCase() !== profile.email.toLowerCase() : false;
  const profileDirty = profile
    ? form.name.trim() !== profile.name || emailChanged || form.phone.trim() !== (profile.phone || '')
    : false;

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setSavingProfile(true);

    try {
      const response = await api.put('/auth/profile', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        ...(emailChanged ? { currentPassword: form.currentPassword } : {}),
      });
      const saved = response.data.data;
      setProfile(saved);
      setForm({ name: saved.name, email: saved.email, phone: saved.phone || '', currentPassword: '' });
      dispatch(profileUpdated({ name: saved.name, email: saved.email, phone: saved.phone }));
      toast.success(t('profile.saved'));
    } catch (error) {
      toast.error(error.response?.data?.message || t('profile.saveFailed'));
    } finally {
      setSavingProfile(false);
    }
  };

  const passwordsMatch = passwords.newPassword === passwords.confirmPassword;
  const passwordValid =
    passwords.currentPassword !== '' && passwords.newPassword.length >= MIN_PASSWORD_LENGTH && passwordsMatch;

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setSavingPassword(true);

    try {
      await api.put('/auth/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success(t('profile.passwordChanged'));
    } catch (error) {
      toast.error(error.response?.data?.message || t('profile.saveFailed'));
    } finally {
      setSavingPassword(false);
    }
  };

  const lastLogin = profile?.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString() : t('users.never');

  return (
    <div className="space-y-6">
      <PageHeader title={t('profile.title')} description={t('profile.description')} />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card icon={UserRound} title={t('profile.infoTitle')} description={t('profile.infoDescription')}>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              {t('profile.name')}
              <input
                className={inputClass}
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
                maxLength={100}
                autoComplete="name"
                disabled={!profile}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              {t('login.email')}
              <input
                className={inputClass}
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
                maxLength={254}
                autoComplete="username"
                disabled={!profile}
              />
              <span className="mt-1 block text-xs font-normal text-slate-500">{t('profile.emailHint')}</span>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              {t('profile.phone')} <span className="font-normal text-slate-400">({t('profile.optional')})</span>
              <input
                className={inputClass}
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                maxLength={20}
                autoComplete="tel"
                disabled={!profile}
              />
            </label>

            {emailChanged ? (
              <label className="block rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900">
                {t('profile.confirmWithPassword')}
                <input
                  className={inputClass}
                  type="password"
                  value={form.currentPassword}
                  onChange={(event) => setForm({ ...form, currentPassword: event.target.value })}
                  autoComplete="current-password"
                  required
                />
              </label>
            ) : null}

            <dl className="grid gap-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('users.role')}</dt>
                <dd className="mt-1 font-medium text-ink">{t(`roles.${profile?.role || sessionUser?.role}`, profile?.role)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('users.lastLogin')}</dt>
                <dd className="mt-1 font-medium text-ink">{lastLogin}</dd>
              </div>
            </dl>
            <p className="text-xs text-slate-500">{t('profile.roleHint')}</p>

            <div className="flex justify-end">
              <button type="submit" className={primaryButton} disabled={!profileDirty || savingProfile || (emailChanged && !form.currentPassword)}>
                <Save className="h-4 w-4" aria-hidden="true" />
                {t('common.saveChanges')}
              </button>
            </div>
          </form>
        </Card>

        <Card icon={KeyRound} title={t('profile.passwordTitle')} description={t('profile.passwordDescription')}>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              {t('profile.currentPassword')}
              <input
                className={inputClass}
                type="password"
                value={passwords.currentPassword}
                onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })}
                autoComplete="current-password"
                required
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              {t('profile.newPassword')}
              <input
                className={inputClass}
                type="password"
                value={passwords.newPassword}
                onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })}
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                maxLength={128}
                required
              />
              <span className="mt-1 block text-xs font-normal text-slate-500">{t('users.passwordHint')}</span>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              {t('profile.confirmPassword')}
              <input
                className={inputClass}
                type="password"
                value={passwords.confirmPassword}
                onChange={(event) => setPasswords({ ...passwords, confirmPassword: event.target.value })}
                autoComplete="new-password"
                required
              />
              {passwords.confirmPassword !== '' && !passwordsMatch ? (
                <span className="mt-1 block text-xs font-normal text-rose-600" role="alert">
                  {t('profile.passwordMismatch')}
                </span>
              ) : null}
            </label>

            <div className="flex justify-end">
              <button type="submit" className={primaryButton} disabled={!passwordValid || savingPassword}>
                <KeyRound className="h-4 w-4" aria-hidden="true" />
                {t('profile.changePassword')}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
