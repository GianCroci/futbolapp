import { useMemo } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { PlayerStat } from '../../types';

interface StatsChartsProps {
  stats: PlayerStat[];
}

const PIE_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#14B8A6'];

export function StatsCharts({ stats }: StatsChartsProps) {
  // Pie chart: goals by player
  const goalsByPlayer = useMemo(() => {
    return [...stats]
      .filter((s) => s.goals > 0)
      .sort((a, b) => b.goals - a.goals)
      .map((s) => ({
        name: s.playerName.split(' ').pop() || s.playerName,
        value: s.goals,
      }));
  }, [stats]);

  // Bar chart: top 5 minutes played
  const top5Minutes = useMemo(() => {
    return [...stats]
      .sort((a, b) => b.totalMinutes - a.totalMinutes)
      .slice(0, 5)
      .map((s) => ({
        name: s.playerName.split(' ').pop() || s.playerName,
        minutos: s.totalMinutes,
      }));
  }, [stats]);

  // Bar chart: top 5 rating
  const top5Rating = useMemo(() => {
    return [...stats]
      .filter((s) => s.avgRating != null)
      .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))
      .slice(0, 5)
      .map((s) => ({
        name: s.playerName.split(' ').pop() || s.playerName,
        rating: s.avgRating ?? 0,
      }));
  }, [stats]);

  const hasAnyData = goalsByPlayer.length > 0 || top5Minutes.length > 0 || top5Rating.length > 0;

  if (!hasAnyData) {
    return (
      <div className="text-center py-12 mb-6">
        <div className="text-5xl mb-3">📊</div>
        <p className="text-gray-500">No hay datos suficientes para mostrar gráficos.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Pie chart: goals scored */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">Goles convertidos</h3>
        {goalsByPlayer.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={goalsByPlayer}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {goalsByPlayer.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value} goles`, 'Goles']} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[240px] text-gray-400 text-sm">
            Sin goles registrados
          </div>
        )}
      </div>

      {/* Bar chart: top 5 minutes played */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">Top 5 minutos jugados</h3>
        {top5Minutes.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={top5Minutes} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: number) => [`${value} min`, 'Minutos']} />
              <Bar dataKey="minutos" fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[240px] text-gray-400 text-sm">
            Sin datos de minutos
          </div>
        )}
      </div>

      {/* Bar chart: top 5 rating */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">Top 5 rating promedio</h3>
        {top5Rating.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={top5Rating} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: number) => [value.toFixed(1), 'Rating']} />
              <Bar dataKey="rating" fill="#F59E0B" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[240px] text-gray-400 text-sm">
            Sin ratings asignados
          </div>
        )}
      </div>
    </div>
  );
}
