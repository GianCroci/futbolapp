import { Goal } from 'lucide-react';
import { landingCopy } from './landingCopy';

/**
 * Minimal landing footer: Goal logo, brand and copyright. Intentionally NO
 * sign-in link (SC-LAND-10) — the only login path on the landing is the
 * Google CTA buttons.
 */
export function LandingFooter() {
  return (
    <footer className="bg-green-950 text-green-100/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
            <Goal className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <span className="font-semibold text-white">{landingCopy.brand}</span>
        </div>
        <p className="text-sm">
          {landingCopy.footer.copyright(new Date().getFullYear())}
        </p>
      </div>
    </footer>
  );
}
