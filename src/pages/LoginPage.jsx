import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import { login } from '../store/authSlice';
import { loginSchema } from '../validations/authSchemas';

export default function LoginPage() {
  const dispatch = useDispatch();
  const { token, status, error } = useSelector((state) => state.auth);
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const onSubmit = async (values) => {
    const result = await dispatch(login(values));

    if (login.fulfilled.match(result)) {
      toast.success('Welcome back');
    }
  };

  if (token) {
    return <Navigate to="/" replace />;
  }

  const features = [
    [t('login.feature1Title'), t('login.feature1Desc')],
    [t('login.feature2Title'), t('login.feature2Desc')],
    [t('login.feature3Title'), t('login.feature3Desc')],
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#2b1b14_0%,_#6a2f1d_38%,_#f2b84b_100%)] px-4 py-10 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="flex flex-col items-center rounded-[2rem] border border-white/10 bg-white/10 p-8 backdrop-blur lg:p-12">
          {/* Krishna deity image */}
          <div className="mb-8 flex flex-col items-center">
            <div className="relative rounded-[1.5rem] border-4 border-yellow-400/70 p-1 shadow-[0_0_40px_rgba(242,184,75,0.35)]">
              <img
                src="/krishna.jpg"
                alt="Lord Krishna — Krishnamath Belagvi"
                className="h-56 w-44 rounded-[1.1rem] object-cover object-top sm:h-64 sm:w-52"
              />
              <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-yellow-400/60 bg-[#2b1b14]/90 px-4 py-1 text-xs font-semibold tracking-widest text-yellow-300">
                ಕೃಷ್ಣಮಠ
              </span>
            </div>
          </div>
          <p className="text-center text-xs uppercase tracking-[0.45em] text-white/70">{t('login.suite')}</p>
          <h1 className="mt-5 text-center max-w-xl font-serif text-4xl leading-tight lg:text-5xl">
            {t('login.headline')}
          </h1>
          <p className="mt-6 text-center max-w-xl text-base text-white/80">
            {t('login.subline')}
          </p>
          <div className="mt-10 w-full grid gap-4 sm:grid-cols-3">
            {features.map(([title, description]) => (
              <div key={title} className="rounded-[1.5rem] border border-white/15 bg-black/10 p-4">
                <p className="font-semibold">{title}</p>
                <p className="mt-2 text-sm text-white/75">{description}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-[2rem] bg-[#fff8ee] p-8 text-ink shadow-2xl lg:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-terracotta/70">Admin login</p>
            <h2 className="mt-3 font-serif text-4xl">Enter the sanctum control room</h2>
            <p className="mt-3 text-sm text-teak/80">Demo access is prefilled so you can verify the workflow immediately.</p>
          </div>
          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-teak">{t('login.email')}</span>
              <input
                {...register('email')}
                className="w-full rounded-2xl border border-sandal bg-white px-4 py-3 outline-none transition focus:border-terracotta"
                placeholder="admin@temple.local"
                autoComplete="email"
              />
              {errors.email ? <span className="mt-2 block text-xs text-terracotta">{errors.email.message}</span> : null}
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-teak">{t('login.password')}</span>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full rounded-2xl border border-sandal bg-white px-4 py-3 pr-12 outline-none transition focus:border-terracotta"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-teak/60 hover:text-teak"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password ? <span className="mt-2 block text-xs text-terracotta">{errors.password.message}</span> : null}
            </label>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-teak disabled:opacity-70"
            >
              {status === 'loading' ? t('login.signingIn') : t('login.signIn')}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
