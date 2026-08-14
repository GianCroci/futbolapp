import { motion, type Variants } from 'motion/react';

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const item: Variants = {
  hidden: { scale: 0.3, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 200, damping: 16 },
  },
};

const pitchLine = {
  stroke: 'rgba(255,255,255,0.65)',
  strokeWidth: 1.5,
  fill: 'none',
} as const;

/**
 * Mini training-diagram preview: an SVG pitch where diagram items (X, O,
 * dashed movement arrow, ball) stagger in on scroll, with the ball looping a
 * gentle y-bob. WhileInView is stubbed in tests (setup.ts), so this renders
 * its final state there (SC-LAND-7).
 */
export function TrainingPreview() {
  return (
    <motion.svg
      data-testid="preview-training"
      viewBox="0 0 320 200"
      className="w-full h-44 sm:h-56"
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      role="img"
      aria-label="Diagrama táctico animado"
    >
      {/* Pitch */}
      <rect x="0" y="0" width="320" height="200" rx="12" fill="#2e8b57" />
      <rect x="10" y="10" width="300" height="180" rx="8" {...pitchLine} />
      <line x1="160" y1="10" x2="160" y2="190" {...pitchLine} />
      <circle cx="160" cy="100" r="24" {...pitchLine} />
      <rect x="10" y="55" width="70" height="90" {...pitchLine} />
      <rect x="240" y="55" width="70" height="90" {...pitchLine} />

      {/* Attacker X */}
      <g transform="translate(100 128)">
        <motion.g variants={item} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
          <line x1="-8" y1="-8" x2="8" y2="8" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
          <line x1="8" y1="-8" x2="-8" y2="8" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
        </motion.g>
      </g>

      {/* Defender O */}
      <g transform="translate(235 78)">
        <motion.g variants={item} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
          <circle r="11" fill="none" stroke="#f87171" strokeWidth="4" />
        </motion.g>
      </g>

      {/* Movement arrow */}
      <motion.path
        d="M 118 140 C 150 120, 180 120, 225 92"
        variants={item}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        stroke="#fbbf24"
        strokeWidth="3"
        strokeDasharray="6 5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Ball with y-bob loop */}
      <g transform="translate(205 162)">
        <motion.g
          variants={item}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        >
          <motion.circle
            r="6"
            fill="#ffffff"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.g>
      </g>
    </motion.svg>
  );
}
