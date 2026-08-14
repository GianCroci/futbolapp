/**
 * Full-screen auth error state, extracted from the old App.tsx gate.
 *
 * Renders a generic es-AR message instead of the raw provider error so the
 * underlying Auth0 failure details never leak to the user. Retry reloads the
 * app, which re-runs the Auth0 initialization flow.
 */
export function AuthErrorState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-bold text-red-600 mb-2">Error de conexión</h2>
        <p className="text-gray-600 mb-4">
          No se pudo conectar con el servicio de autenticación. Verificá tu conexión e
          intentá de nuevo.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
