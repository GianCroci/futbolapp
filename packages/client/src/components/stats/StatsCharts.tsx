import { useMemo } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { PlayerStat } from '../../types';

interface StatsChartsProps {
  stats: PlayerStat[];
}

const PIE_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];

export function StatsCharts({ stats }: StatsChartsProps) {
  const goalsByPosition = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of stats) {
      if (s.goals > 0) {
        map.set(s.position, (map.get(s.position) || 0) + s.goals);
      }
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [stats]);

  const topScorers = useMemo(() => {
    return [...stats]
      .filter((s) => s.goals > 0 || s.assists > 0)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 8)
      .map((s) => ({
        name: s.playerName.split(' ').pop() || s.playerName,
        goles: s.goals,
        asistencias: s.assists,
      }));
  }, [stats]);

  const goalsByPositionEmpty = goalsByPosition.length === 0;
  const topScorersEmpty = topScorers.length === 0;

  if (goalsByPositionEmpty && topScorersEmpty) {
    return (
      <div className="text-center py-12 mb-6">
        <div className="text-5xl mb-3">📊</div>
        <p className="text-gray-500">No hay datos suficientes para mostrar gráficos.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Pie chart: goals by position */}
      {!goalsByPositionEmpty && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Goles por posición</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={goalsByPosition}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {goalsByPosition.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value} goles`, 'Goles']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bar chart: top scorers + assists */}
      {!topScorersEmpty && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Goles y asistencias por jugador</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topScorers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                dataKey="name"
                type="category"
                width={80}
                tick={{ fontSize: 12 }}
              />
              <Tooltip />
              <Legend />
              <Bar dataKey="goles" fill="#10B981" radius={[0, 4, 4, 0]} />
              <Bar dataKey="asistencias" fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
