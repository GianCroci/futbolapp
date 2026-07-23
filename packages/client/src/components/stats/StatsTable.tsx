import { useState, useMemo } from 'react';
import { PlayerStat } from '../../types';

interface StatsTableProps {
  stats: PlayerStat[];
}

type SortKey = keyof PlayerStat;
type SortDirection = 'asc' | 'desc';

interface Column {
  key: SortKey;
  label: string;
  align?: 'left' | 'right';
}

const COLUMNS: Column[] = [
  { key: 'playerName', label: 'Jugador', align: 'left' },
  { key: 'position', label: 'Posición', align: 'left' },
  { key: 'dorsal', label: 'Dorsal', align: 'right' },
  { key: 'totalMinutes', label: 'Minutos', align: 'right' },
  { key: 'goals', label: 'Goles', align: 'right' },
  { key: 'assists', label: 'Asistencias', align: 'right' },
  { key: 'yellowCards', label: '🟨', align: 'right' },
  { key: 'redCards', label: '🟥', align: 'right' },
  { key: 'appearances', label: 'Partidos', align: 'right' },
];

export function StatsTable({ stats }: StatsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('goals');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = useMemo(() => {
    return [...stats].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      const numA = Number(aVal);
      const numB = Number(bVal);
      return sortDir === 'asc' ? numA - numB : numB - numA;
    });
  }, [stats, sortKey, sortDir]);

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) {
      return (
        <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return (
      <svg
        className={`w-3 h-3 text-green-600 ${sortDir === 'desc' ? '' : 'rotate-180'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (stats.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Sin datos</h3>
        <p className="text-gray-500">No hay estadísticas disponibles para este equipo.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className={`px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 transition-colors select-none ${
                  col.align === 'right' ? 'text-right' : 'text-left'
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  <SortIcon columnKey={col.key} />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map((stat) => (
            <tr key={stat.playerId} className="hover:bg-gray-50 transition-colors">
              <td className="px-3 py-2.5 font-medium text-gray-800">{stat.playerName}</td>
              <td className="px-3 py-2.5 text-gray-600">{stat.position}</td>
              <td className="px-3 py-2.5 text-right font-mono text-gray-600">{stat.dorsal ?? '—'}</td>
              <td className="px-3 py-2.5 text-right font-mono">{stat.totalMinutes}</td>
              <td className="px-3 py-2.5 text-right font-mono font-semibold text-green-700">{stat.goals}</td>
              <td className="px-3 py-2.5 text-right font-mono text-blue-700">{stat.assists}</td>
              <td className="px-3 py-2.5 text-right font-mono text-yellow-600">{stat.yellowCards}</td>
              <td className="px-3 py-2.5 text-right font-mono text-red-600">{stat.redCards}</td>
              <td className="px-3 py-2.5 text-right font-mono">{stat.appearances}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
