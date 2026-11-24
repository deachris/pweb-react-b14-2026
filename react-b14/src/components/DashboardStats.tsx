import type { Application } from '../types';
import { getApplicationStats } from '../utils/offerAnalytics';

interface DashboardStatsProps {
  applications: Application[];
}

export function DashboardStats({
  applications,
}: DashboardStatsProps) {
  // Dihitung langsung dari data, bukan disimpan ke useState.
  const stats = getApplicationStats(applications);

  const cards = [
    {
      title: 'Total Lamaran',
      value: stats.total,
    },
    {
      title: 'Response Rate',
      value: `${stats.responseRate}%`,
    },
    {
      title: 'Interview Rate',
      value: `${stats.interviewRate}%`,
    },
    {
      title: 'Rawan Ghosting',
      value: stats.ghosting,
    },
    {
      title: 'Total Offer',
      value: stats.offers,
    },
  ];

  return (
    <section
      className="dashboard-stats"
      aria-label="Statistik Lamaran"
    >
      {cards.map((card) => (
        <article
          key={card.title}
          className="panel-box dashboard-stat-card"
        >
          <h3>{card.title}</h3>
          <strong>{card.value}</strong>
        </article>
      ))}
    </section>
  );
}