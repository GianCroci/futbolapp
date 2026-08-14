import { ChevronDown, Goal } from 'lucide-react';
import { motion, type Variants } from 'motion/react';
import { LandingCTAButton } from './LandingCTAButton';
import { landingCopy } from './landingCopy';

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 120, damping: 20 },
  },
};

/**
 * Landing hero: Goal logo + brand wordmark, the value proposition headline,
 * subtitle, primary Google CTA and an animated entrance (staggered spring).
 * Paints instantly — no auth gate here (SC-LAND-1).
 */
export function LandingHero() {
  return (
    <header className="relative min-h-screen bg-gradient-to-br from-green-700 via-green-800 to-green-950 text-white flex flex-col items-center justify-center px-4 py-20 text-center overflow-hidden">
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="max-w-4xl"
      >
        <motion.div variants={item} className="flex items-center justify-center gap-3 mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg ring-4 ring-white/10">
            <Goal className="w-9 h-9" aria-hidden="true" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight">
            {landingCopy.brand}
          </span>
        </motion.div>

        <motion.h1
          variants={item}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight"
        >
          {landingCopy.hero.title}
        </motion.h1>

        <motion.p
          variants={item}
          className="mt-6 text-lg sm:text-xl text-green-100/90 max-w-2xl mx-auto"
        >
          {landingCopy.hero.subtitle}
        </motion.p>

        <motion.div variants={item} className="mt-10">
          <LandingCTAButton variant="dark" />
        </motion.div>
      </motion.div>

      <motion.div
        aria-hidden="true"
        className="absolute bottom-6"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ChevronDown className="w-8 h-8 text-green-200/70" />
      </motion.div>
    </header>
  );
}
