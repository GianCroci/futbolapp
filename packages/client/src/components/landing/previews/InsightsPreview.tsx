import { Sparkles } from 'lucide-react';
import { motion, type Variants } from 'motion/react';

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const bar: Variants = {
  hidden: { scaleY: 0 },
  visible: { scaleY: 1, transition: { duration: 0.5, ease: 'easeOut' } },
};

const HEIGHTS = [42, 68, 52, 88, 62, 96, 74, 58];

/**
 * Mini insights preview: an SVG bar chart that grows bar-by-bar on scroll,
 * beside an AI insight card with a looping pulse (SC-LAND-7). Under
 * prefers-reduced-motion the bars render statically (transforms disabled by
 * MotionConfig); the opacity pulse is intentionally kept.
 */
export function InsightsPreview() {
  return (
    <div data-testid="preview-insights" className="flex items-center gap-3 sm:gap-5">
      <motion.svg
        viewBox="0 0 300 150"
        className="w-full h-36 sm:h-44"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        role="img"
        aria-label="Estadísticas animadas"
      >
        <line x1="10" y1="130" x2="290" y2="130" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        {HEIGHTS.map((height, index) => (
          <motion.rect
            key={index}
            data-bar
            variants={bar}
            x={14 + index * 34}
            y={130 - height}
            width="18"
            height={height}
            rx="3"
            fill={index % 2 === 0 ? '#5dc280' : '#2e8b57'}
            style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }}
          />
        ))}
      </motion.svg>

      <motion.div
        className="shrink-0 w-24 h-20 rounded-xl bg-gradient-to-br from-green-600 to-green-700 shadow-lg flex flex-col items-center justify-center gap-2"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        role="img"
        aria-label="Análisis con IA"
      >
        <Sparkles className="w-5 h-5 text-white" aria-hidden="true" />
        <span className="flex gap-1" aria-hidden="true">
          <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
        </span>
      </motion.div>
    </div>
  );
}
