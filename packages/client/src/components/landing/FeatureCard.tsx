import type { LucideIcon } from 'lucide-react';

export interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  desc: string;
}

/**
 * Small feature card: lucide icon badge + short es-AR title + 1–2 line
 * description (SC-LAND-9). Copy always comes from landingCopy.ts.
 */
export function FeatureCard({ icon: Icon, title, desc }: FeatureCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-green-100">
      <div className="w-10 h-10 rounded-lg bg-green-50 text-green-700 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5" aria-hidden="true" />
      </div>
      <h3 className="font-semibold text-gray-800">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{desc}</p>
    </div>
  );
}
