import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import Logo from '../components/Logo';
import { homePathFor } from '../constants/navigation';
import { login } from '../store/authSlice';
import { loginSchema } from '../validations/authSchemas';

// Shows the same text in English and Kannada side by side, independent of the language toggle.
const bilingualKeys = (t, key) => ({ en: t(key, { lng: 'en' }), kn: t(key, { lng: 'kn' }) });

function Bilingual({ text }) {
  return (
    <>
      {text.en}
      <span className="font-normal opacity-75"> / {text.kn}</span>
    </>
  );
}

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20';

export default function LoginPage() {
  const dispatch = useDispatch();
  const { token, user, status, error } = useSelector((state) => state.auth);
  const { t } = useTranslation();
  const text = (key) => bilingualKeys(t, key);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const onSubmit = async (values) => {
    const result = await dispatch(login(values));

    if (login.fulfilled.match(result)) {
      toast.success(`${text('login.welcome').en} / ${text('login.welcome').kn}`);
    }
  };

  if (token) {
    return <Navigate to={homePathFor(user?.role)} replace />;
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden flex-col items-center justify-center overflow-hidden bg-slate-900 p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand/30 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" aria-hidden="true" />

        <figure className="relative flex flex-col items-center text-center">
          <img
            src="/krishna.jpg"
            alt="Lord Krishna"
            className="h-80 w-64 rounded-2xl object-cover object-top shadow-2xl ring-1 ring-white/20"
          />
          <figcaption className="mt-8">
            <p className="text-2xl font-semibold tracking-tight">ಶ್ರೀ ಕೃಷ್ಣಮಠ ಮತ್ತು ಸಭಾಭವನ, ಬೆಳಗಾವಿ</p>
            <p className="mt-2 text-lg font-medium text-slate-200">Sri Krishnamath & Sabhabhavan, Belagavi</p>
          </figcaption>
        </figure>
      </section>

      <section className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-4 lg:hidden">
            <img src="/krishna.jpg" alt="Lord Krishna" className="h-28 w-28 rounded-full object-cover object-top ring-4 ring-indigo-100" />
            <div className="text-center">
              <p className="text-base font-semibold text-ink">ಶ್ರೀ ಕೃಷ್ಣಮಠ ಮತ್ತು ಸಭಾಭವನ, ಬೆಳಗಾವಿ</p>
              <p className="text-sm text-slate-500">Sri Krishnamath & Sabhabhavan, Belagavi</p>
            </div>
          </div>
          <div className="hidden lg:block">
            <Logo tone="dark" subtitle={`${t('nav.tagline', { lng: 'en' })} · ${t('nav.tagline', { lng: 'kn' })}`} />
          </div>
          <h2 className="mt-8 text-2xl font-semibold tracking-tight text-ink lg:mt-10"><Bilingual text={text('login.title')} /></h2>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                <Bilingual text={text('login.email')} />
              </span>
              <input
                {...register('email')}
                type="email"
                className={inputClass}
                placeholder="you@krishnamath.co.in"
                autoComplete="username"
              />
              {errors.email ? <span className="mt-1.5 block text-xs text-rose-600">{errors.email.message}</span> : null}
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                <Bilingual text={text('login.password')} />
              </span>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className={`${inputClass} pr-11`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password / ಪಾಸ್‌ವರ್ಡ್ ಮರೆಮಾಡಿ' : 'Show password / ಪಾಸ್‌ವರ್ಡ್ ತೋರಿಸಿ'}
                >
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
              {errors.password ? <span className="mt-1.5 block text-xs text-rose-600">{errors.password.message}</span> : null}
            </label>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand/40 focus:ring-offset-2 disabled:opacity-70"
            >
              {status === 'loading' ? <Bilingual text={text('login.signingIn')} /> : <Bilingual text={text('login.signIn')} />}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
