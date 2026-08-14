import { motion, type Variants } from 'motion/react';
import { LandingCTAButton } from './LandingCTAButton';
import { FeatureCard } from './FeatureCard';
import type { LandingModule } from './landingCopy';

const reveal: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 22 },
  },
};

interface ModuleSectionProps {
  module: LandingModule;
  /** Alternate the content/preview order on desktop (md:order-*) */
  reversed?: boolean;
}

/**
 * One landing module: header (icon + es-AR title + one-sentence desc),
 * feature card grid, animated preview and a Google CTA (SC-LAND-6).
 * Scroll-triggered reveal via motion `whileInView` (once).
 */
export function ModuleSection({ module, reversed = false }: ModuleSectionProps) {
  const Preview = module.preview;
  const cardColumns =
    module.features.length === 4
      ? 'sm:grid-cols-2 lg:grid-cols-4'
      : 'sm:grid-cols-2 lg:grid-cols-3';

  return (
    <section id={module.id} className="py-16 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <motion.div
            variants={reveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className={reversed ? 'md:order-2' : undefined}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                <module.icon className="w-6 h-6" aria-hidden="true" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {module.title}
              </h2>
            </div>
            <p className="mt-4 text-lg text-gray-600">{module.desc}</p>

            <div className={`grid gap-4 mt-8 ${cardColumns}`}>
              {module.features.map((feature) => (
                <FeatureCard key={feature.title} {...feature} />
              ))}
            </div>

            <div className="mt-8">
              <LandingCTAButton />
            </div>
          </motion.div>

          <motion.div
            variants={reveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className={reversed ? 'md:order-1' : undefined}
          >
            <div className="rounded-2xl border border-green-100 bg-white p-4 sm:p-6 shadow-lg">
              <Preview />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
