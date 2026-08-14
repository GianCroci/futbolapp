import { Navigate } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { MODULES } from '../components/landing/landingCopy';
import { LandingHero } from '../components/landing/LandingHero';
import { ModuleSection } from '../components/landing/ModuleSection';
import { LandingFooter } from '../components/landing/LandingFooter';

/**
 * Public landing for logged-out users. `isAuthenticated` comes from the
 * persisted zustand store (synchronous), so authenticated visitors redirect
 * to /dashboard with zero flash (SC-LAND-2). MotionConfig reducedMotion="user"
 * disables transform/layout animations when the OS prefers reduced motion
 * while keeping opacity transitions, so previews render static (SC-LAND-8).
 * All copy is es-AR and lives in landingCopy.ts.
 */
export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <MotionConfig reducedMotion="user">
      <main className="bg-white">
        <LandingHero />
        {MODULES.map((module, index) => (
          <ModuleSection key={module.id} module={module} reversed={index % 2 === 1} />
        ))}
        <LandingFooter />
      </main>
    </MotionConfig>
  );
}
