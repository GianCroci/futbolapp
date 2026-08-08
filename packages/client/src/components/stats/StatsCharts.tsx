import { useMemo } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { PlayerStat } from '../../types';

interface StatsChartsProps {
  stats: PlayerStat[];
}

const PIE_COLORS = ['#2e8b57', '#3ba563', '#5dc280', '#93dbaa', '#276f48', '#1b5e20', '#4caf50', '#1b4a2f'];

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[240px] text-gray-400">
      <svg className="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
      <span className="text-xs">{message}</span>
    </div>
  );
}

export function StatsCharts({ stats }: StatsChartsProps) {
  const goalsByPlayer = useMemo(() => {
    return [...stats]
      .filter((s) => s.goals > 0)
      .sort((a, b) => b.goals - a.goals)
      .map((s) => ({
        name: s.playerName.split(' ').pop() || s.playerName,
        value: s.goals,
      }));
  }, [stats]);

  const top5Minutes = useMemo(() => {
    return [...stats]
      .sort((a, b) => b.totalMinutes - a.totalMinutes)
      .slice(0, 5)
      .map((s) => ({
        name: s.playerName.split(' ').pop() || s.playerName,
        minutos: s.totalMinutes,
      }));
  }, [stats]);

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
                label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {goalsByPlayer.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} goles`, 'Goles']} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="Sin goles registrados" />
        )}
      </div>

      {/* Bar chart: top 5 minutes played */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">Top 5 minutos jugados</h3>
        {top5Minutes.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={top5Minutes} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => [`${value} min`, 'Minutos']} />
              <Bar dataKey="minutos" fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="Sin datos de minutos" />
        )}
      </div>

      {/* Bar chart: top 5 rating */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">Top 5 rating promedio</h3>
        {top5Rating.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={top5Rating} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => [Number(value ?? 0).toFixed(1), 'Rating']} />
              <Bar dataKey="rating" fill="#F59E0B" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="Sin ratings asignados" />
        )}
      </div>
    </div>
  );
}
