/**
 * Suspense fallback for the lazy-loaded landing (wired in App.tsx by PR4).
 * A green skeleton with pulsing blocks — intentionally no "Cargando..." text:
 * the landing must never show a loading gate (SC-LAND-1).
 */
export function LandingFallback() {
  return (
    <div
      aria-hidden="true"
      className="min-h-screen bg-gradient-to-br from-green-700 via-green-800 to-green-950 flex flex-col items-center justify-center gap-5 px-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-white/15 animate-pulse" />
        <div className="h-7 w-36 bg-white/15 rounded-lg animate-pulse" />
      </div>
      <div className="h-11 w-3/4 max-w-lg bg-white/15 rounded-xl animate-pulse" />
      <div className="h-11 w-1/2 max-w-sm bg-white/15 rounded-xl animate-pulse" />
      <div className="h-12 w-60 bg-white/15 rounded-full animate-pulse" />
    </div>
  );
}
