import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { loginSchema, type LoginInput } from '@sharvi/shared';
import { useAuth } from '@/stores/auth';
import { ApiError } from '@/lib/api';
import { Seo } from '@/components/Seo';

export function AdminLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, status, fetchMe } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (status === 'idle') void fetchMe();
    if (status === 'authenticated') navigate('/admin', { replace: true });
  }, [status, fetchMe, navigate]);

  const onSubmit = async (data: LoginInput) => {
    setError(null);
    try {
      await login(data.email, data.password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'));
    }
  };

  const inputCls =
    'w-full rounded-xl border border-maroon-200 bg-white px-4 py-3 text-sm outline-none focus:border-maroon-500';

  return (
    <div className="admin-scope flex min-h-screen items-center justify-center bg-ivory px-4">
      <Seo title={t('admin.login')} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card w-full max-w-sm p-8"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-maroon-50 text-maroon-600">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="font-serif text-2xl text-maroon-700">Sharvi Collections</h1>
          <p className="text-sm text-ink/60">{t('admin.login')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-ink/70">{t('admin.email')}</label>
            <input
              {...register('email')}
              type="text"
              autoComplete="username"
              placeholder="admin"
              className={inputCls}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink/70">{t('admin.password')}</label>
            <input
              {...register('password')}
              type="password"
              autoComplete="current-password"
              className={inputCls}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? t('admin.signingIn') : t('admin.signIn')}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
