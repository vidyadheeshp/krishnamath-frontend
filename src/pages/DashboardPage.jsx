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
        <StatCard label={t('dashboard.currentDayBookings')} value={stats.currentDayBookings || 0} tone="warm" />
        <StatCard label={t('dashboard.totalDevoteesVisited')} value={stats.totalDevoteesVisited || 0} tone="plain" />
        <StatCard label={t('dashboard.dailyCollection')} value={stats.dailyCollectionAmount || 0} tone="earthy" currency />
        <StatCard label={t('dashboard.monthlyCollection')} value={stats.monthlyCollectionAmount || 0} tone="warm" currency />
        <StatCard label={t('dashboard.totalExpenditures')} value={stats.totalExpenditures || 0} tone="green" currency />
        <StatCard label={t('dashboard.sevasPerformed')} value={stats.totalSevasPerformed || 0} tone="plain" />
      </div>
      <DashboardCharts revenue={dashboard?.analytics?.monthlyRevenue} popularSevas={dashboard?.analytics?.popularSevas || []} />
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[1.75rem] border border-white/70 bg-white p-6 shadow-card">
          <h2 className="font-serif text-2xl text-ink">{t('dashboard.upcomingEvents')}</h2>
          <div className="mt-5 space-y-4">
            {(dashboard?.upcomingEvents || []).map((event) => (
              <div key={`${event.title}-${event.date}`} className="flex items-center justify-between rounded-2xl bg-sandal/55 px-4 py-4">
                <div>
                  <p className="font-semibold text-ink">{event.title}</p>
                  <p className="text-sm text-teak/70">{event.type}</p>
                </div>
                <div className="text-sm font-semibold text-terracotta">{formatDate(event.date)}</div>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-[1.75rem] border border-white/70 bg-white p-6 shadow-card">
          <h2 className="font-serif text-2xl text-ink">{t('dashboard.recentNotifications')}</h2>
          <div className="mt-5 space-y-4">
            {(dashboard?.notifications || []).map((notification) => (
              <div key={notification.id} className="rounded-2xl border border-sandal px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold text-ink">{notification.title}</p>
                  <span className="rounded-full bg-sandal px-3 py-1 text-xs uppercase tracking-[0.2em] text-teak">
                    {notification.type}
                  </span>
                </div>
                <p className="mt-2 text-sm text-teak/80">{notification.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
