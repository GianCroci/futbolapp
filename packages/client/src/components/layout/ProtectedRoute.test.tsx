import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { ProtectedRoute } from './ProtectedRoute';

/**
 * Auth0 is mocked so ProtectedRoute behavior is driven by its inputs
 * (isAuthenticated / isLoading / error) instead of a real provider.
 */
const { mockUseAuth0 } = vi.hoisted(() => ({ mockUseAuth0: vi.fn() }));

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => mockUseAuth0(),
}));

// useAuth() syncs the Auth0 profile to the server in the background; stub the
// API client so the authenticated case never issues a real network request.
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: { id: 'u1', email: 'ana@futbol.app', name: 'Ana', picture: null },
    }),
  },
}));

const mockUser = { id: 'u1', email: 'ana@futbol.app', name: 'Ana', picture: null };

function mockAuth0State(overrides: Record<string, unknown> = {}) {
  mockUseAuth0.mockReturnValue({
    isAuthenticated: false,
    isLoading: false,
    error: null,
    user: null,
    loginWithRedirect: vi.fn(),
    logout: vi.fn(),
    getIdTokenClaims: vi.fn(),
    ...overrides,
  });
}

/**
 * Deep link into a protected route (/teams/123) inside a router that also
 * declares the unauthenticated redirect target (/) and the /login fallback.
 */
function renderTree() {
  return (
    <MemoryRouter initialEntries={['/teams/123']}>
      <Routes>
        <Route
          path="/teams/123"
          element={
            <ProtectedRoute>
              <div>protected content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>login fallback page</div>} />
        <Route path="/" element={<div>landing root</div>} />
      </Routes>
    </MemoryRouter>
  );
}

function renderProtected() {
  return render(renderTree());
}

describe('ProtectedRoute (SC-LAND-11: auth gating refactor)', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isLoading: false,
      error: null,
    });
    mockAuth0State();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('redirects unauthenticated users away from the deep link', () => {
    renderProtected();

    // Redirect target flipped /login -> / in PR4 (SC-LAND-11): the deep link
    // lands on `/`, which now renders the landing.
    expect(screen.getByText('landing root')).toBeInTheDocument();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  it('renders AuthErrorState when Auth0 reports an error', () => {
    mockAuth0State({ error: new Error('Auth0 unavailable') });

    renderProtected();

    expect(
      screen.getByRole('heading', { name: 'Error de conexión' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'No se pudo conectar con el servicio de autenticación. Verificá tu conexión e intentá de nuevo.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  it('renders children for authenticated users', async () => {
    useAuthStore.setState({
      user: mockUser,
      accessToken: 'stored-token',
      isLoading: false,
      error: null,
    });
    mockAuth0State({
      isAuthenticated: true,
      user: { sub: 'u1', email: mockUser.email, name: mockUser.name },
      getIdTokenClaims: vi.fn().mockResolvedValue({ __raw: 'fake-id-token' }),
    });

    renderProtected();

    expect(await screen.findByText('protected content')).toBeInTheDocument();
    expect(screen.queryByText('login fallback page')).not.toBeInTheDocument();
  });

  it('SC-LAND-11: waits for Auth0, then unauthenticated deep links land on / (landing), not /login', () => {
    // While Auth0 is resolving, ProtectedRoute holds the gate: no redirect yet.
    mockAuth0State({ isLoading: true });
    const { unmount } = renderProtected();

    expect(screen.queryByText('landing root')).not.toBeInTheDocument();
    expect(screen.queryByText('login fallback page')).not.toBeInTheDocument();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();

    // Auth0 resolves unauthenticated -> redirect to `/` (landing), not /login.
    unmount();
    mockAuth0State({ isLoading: false });
    renderProtected();

    expect(screen.getByText('landing root')).toBeInTheDocument();
    expect(screen.queryByText('login fallback page')).not.toBeInTheDocument();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });
});
