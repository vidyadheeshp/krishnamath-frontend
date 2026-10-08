import { Banknote, CalendarCheck, HandHeart, Receipt, Sparkles, Users, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import api from '../api/client';
import DashboardCharts from '../components/DashboardCharts';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { formatDate } from '../utils/format';

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await api.get('/dashboard');
        setDashboard(response.data.data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load dashboard');
      }
    };

    loadDashboard();
  }, []);

  const stats = dashboard?.stats || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('dashboard.title')}
        description={t('dashboard.description')}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label={t('dashboard.currentDayBookings')} value={stats.currentDayBookings || 0} tone="brand" icon={CalendarCheck} />
        <StatCard label={t('dashboard.totalDevoteesVisited')} value={stats.totalDevoteesVisited || 0} tone="earthy" icon={Users} />
        <StatCard label={t('dashboard.dailyCollection')} value={stats.dailyCollectionAmount || 0} tone="green" currency icon={Banknote} />
        <StatCard label={t('dashboard.monthlyCollection')} value={stats.monthlyCollectionAmount || 0} tone="green" currency icon={Wallet} />
        <StatCard label={t('dashboard.totalExpenditures')} value={stats.totalExpenditures || 0} tone="red" currency icon={Receipt} />
        <StatCard label={t('dashboard.sevasPerformed')} value={stats.totalSevasPerformed || 0} tone="warm" icon={HandHeart} />
      </div>
      <DashboardCharts revenue={dashboard?.analytics?.monthlyRevenue} popularSevas={dashboard?.analytics?.popularSevas || []} />
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink"><Sparkles className="h-4 w-4 text-brand" aria-hidden="true" />{t('dashboard.upcomingEvents')}</h2>
          <div className="mt-5 space-y-4">
            {(dashboard?.upcomingEvents || []).map((event) => (
              <div key={`${event.title}-${event.date}`} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3.5">
                <div>
                  <p className="font-semibold text-ink">{event.title}</p>
                  <p className="text-sm text-slate-500">{event.type}</p>
                </div>
                <div className="text-sm font-semibold text-brand">{formatDate(event.date)}</div>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="text-lg font-semibold text-ink">{t('dashboard.recentNotifications')}</h2>
          <div className="mt-5 space-y-4">
            {(dashboard?.notifications || []).map((notification) => (
              <div key={notification.id} className="rounded-lg border border-slate-200 px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold text-ink">{notification.title}</p>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-600">
                    {notification.type}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{notification.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
