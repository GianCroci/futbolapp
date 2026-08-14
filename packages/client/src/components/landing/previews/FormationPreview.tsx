import { motion, type Variants } from 'motion/react';

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const player: Variants = {
  hidden: { x: -40, y: 40, opacity: 0 },
  visible: {
    x: 0,
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 120, damping: 14 },
  },
};

const pitchLine = {
  stroke: 'rgba(255,255,255,0.6)',
  strokeWidth: 1.5,
  fill: 'none',
} as const;

/** 4-4-2 slot coordinates on a 320x220 pitch, attacking upward. */
const SLOTS: { cx: number; cy: number; keeper?: boolean }[] = [
  { cx: 160, cy: 195, keeper: true },
  { cx: 48, cy: 150 },
  { cx: 123, cy: 158 },
  { cx: 197, cy: 158 },
  { cx: 272, cy: 150 },
  { cx: 80, cy: 105 },
  { cx: 160, cy: 92 },
  { cx: 160, cy: 120 },
  { cx: 240, cy: 105 },
  { cx: 108, cy: 52 },
  { cx: 212, cy: 52 },
];

/**
 * Mini formation preview: 11 players spring-assemble from off-pitch into a
 * 4-4-2 when scrolled into view (SC-LAND-7). Reduced-motion users get the
 * assembled formation statically (MotionConfig reducedMotion="user").
 */
export function FormationPreview() {
  return (
    <motion.svg
      data-testid="preview-formation"
      viewBox="0 0 320 220"
      className="w-full h-44 sm:h-56"
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      role="img"
      aria-label="Formación 4-4-2 animada"
    >
      {/* Pitch */}
      <rect x="0" y="0" width="320" height="220" rx="12" fill="#2e8b57" />
      <rect x="10" y="10" width="300" height="200" rx="8" {...pitchLine} />
      <line x1="160" y1="10" x2="160" y2="210" {...pitchLine} />
      <circle cx="160" cy="110" r="26" {...pitchLine} />
      <rect x="10" y="20" width="85" height="70" {...pitchLine} />
      <rect x="225" y="20" width="85" height="70" {...pitchLine} />
      <rect x="10" y="130" width="85" height="70" {...pitchLine} />
      <rect x="225" y="130" width="85" height="70" {...pitchLine} />
      {/* Goal mouth */}
      <rect x="135" y="6" width="50" height="6" fill="rgba(255,255,255,0.85)" />

      {SLOTS.map((slot, index) => (
        <g key={index} transform={`translate(${slot.cx} ${slot.cy})`}>
          <motion.circle
            data-player
            variants={player}
            r="8.5"
            fill={slot.keeper ? '#f59e0b' : '#ffffff'}
            stroke={slot.keeper ? '#fbbf24' : '#2e8b57'}
            strokeWidth="2"
          />
          <circle r="3" fill={slot.keeper ? 'rgba(255,255,255,0.85)' : 'rgba(46,139,87,0.85)'} />
        </g>
      ))}
    </motion.svg>
  );
}
