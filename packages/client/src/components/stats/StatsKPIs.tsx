import { PlayerStat } from '../../types';

interface StatsKPIsProps {
  stats: PlayerStat[];
}

interface KPIData {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  bgColor: string;
}

export function StatsKPIs({ stats }: StatsKPIsProps) {
  if (stats.length === 0) return null;

  const totalGoals = stats.reduce((sum, s) => sum + s.goals, 0);
  const totalAssists = stats.reduce((sum, s) => sum + s.assists, 0);
  const totalAppearances = stats.reduce((sum, s) => sum + s.appearances, 0);
  const totalMinutes = stats.reduce((sum, s) => sum + s.totalMinutes, 0);
  const totalYellowCards = stats.reduce((sum, s) => sum + s.yellowCards, 0);
  const totalRedCards = stats.reduce((sum, s) => sum + s.redCards, 0);
  const ratedPlayers = stats.filter((s) => s.avgRating != null);
  const avgRating = ratedPlayers.length > 0
    ? (ratedPlayers.reduce((sum, s) => sum + (s.avgRating ?? 0), 0) / ratedPlayers.length).toFixed(1)
    : '—';

  const topScorer = stats.reduce((best, s) => s.goals > best.goals ? s : best, stats[0]);
  const topAssister = stats.reduce((best, s) => s.assists > best.assists ? s : best, stats[0]);

  const kpis: KPIData[] = [
    {
      label: 'Goles totales',
      value: totalGoals,
      icon: '⚽',
      color: 'text-green-700',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Asistencias totales',
      value: totalAssists,
      icon: '🅰️',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Partidos jugados',
      value: totalAppearances,
      icon: '🏟️',
      color: 'text-purple-700',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Minutos totales',
      value: totalMinutes.toLocaleString(),
      icon: '⏱️',
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-50',
    },
    {
      label: 'Rating promedio',
      value: avgRating,
      icon: '⭐',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
    },
    {
      label: 'Tarjetas amarillas',
      value: totalYellowCards,
      icon: '🟨',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
    },
    {
      label: 'Tarjetas rojas',
      value: totalRedCards,
      icon: '🟥',
      color: 'text-red-700',
      bgColor: 'bg-red-50',
    },
    {
      label: 'Goleador top',
      value: topScorer.goals > 0 ? `${topScorer.playerName} (${topScorer.goals})` : '—',
      icon: '🏆',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className={`${kpi.bgColor} rounded-xl p-4 border border-gray-100`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{kpi.icon}</span>
            <span className="text-xs font-medium text-gray-500">{kpi.label}</span>
          </div>
          <p className={`text-2xl font-bold ${kpi.color}`}>
            {kpi.value}
          </p>
        </div>
      ))}
    </div>
  );
}
