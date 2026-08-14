import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import LandingPage from './LandingPage';

/**
 * Landing smoke tests (tasks 5.1/5.2/5.4, phase 5). LandingPage is imported
 * directly (not via React.lazy) and rendered inside a MemoryRouter that also
 * declares the authenticated redirect target. Auth0 is mocked per discovery
 * #156; setup.ts stubs IntersectionObserver and matchMedia.
 */
const { mockUseAuth0 } = vi.hoisted(() => ({ mockUseAuth0: vi.fn() }));

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => mockUseAuth0(),
}));

// useAuth() syncs the Auth0 profile to the server in the background; stub the
// API client so the authenticated case never issues a real network request.
vi.mock('../services/api', () => ({
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

function renderLanding() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<div>dashboard stub</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LandingPage (SC-LAND-1, 5, 6, 7, 8, 9, 10, 13)', () => {
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

  it('renders instantly with brand, hero title and Google CTA (SC-LAND-1, 5)', () => {
    renderLanding();

    expect(screen.getAllByText('FutbolApp').length).toBeGreaterThan(0);
    expect(
      screen.getByRole('heading', {
        name: 'Administrá tus equipos de fútbol: entrenamientos, formaciones y datos con IA',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: /iniciar sesión con google/i }),
    ).not.toHaveLength(0);
    // No Auth0 loading gate on the landing (SC-LAND-1: instant paint).
    expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
  });

  it('renders the three modules in order, each with cards, preview and CTA (SC-LAND-6)', () => {
    renderLanding();

    const entrenamientos = screen.getByRole('heading', { name: 'Entrenamientos' });
    const equipo = screen.getByRole('heading', { name: 'Equipo y Formaciones' });
    const datos = screen.getByRole('heading', { name: 'Datos e IA' });

    expect(entrenamientos.compareDocumentPosition(equipo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(equipo.compareDocumentPosition(datos) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    for (const title of ['Entrenamientos', 'Equipo y Formaciones', 'Datos e IA']) {
      const section = screen.getByRole('heading', { name: title }).closest('section');
      expect(section).not.toBeNull();
      expect(
        within(section!).getAllByRole('button', { name: /iniciar sesión con google/i }),
      ).not.toHaveLength(0);
    }
  });

  it('renders feature cards that describe real features (SC-LAND-9)', () => {
    renderLanding();

    const equipo = screen
      .getByRole('heading', { name: 'Equipo y Formaciones' })
      .closest('section')!;

    expect(within(equipo).getByRole('heading', { name: 'Formaciones' })).toBeInTheDocument();
    expect(
      within(equipo).getByText(/Armá tu once con arrastrar y soltar\.$/),
    ).toBeInTheDocument();
    expect(within(equipo).getByRole('heading', { name: 'Jugadores' })).toBeInTheDocument();
    expect(within(equipo).getByRole('heading', { name: 'Fixture' })).toBeInTheDocument();
    expect(within(equipo).getByRole('heading', { name: 'Lesiones' })).toBeInTheDocument();
  });

  it('renders the animated previews with their content (SC-LAND-7)', () => {
    renderLanding();

    expect(screen.getByTestId('preview-training')).toBeInTheDocument();
    const formation = screen.getByTestId('preview-formation');
    expect(formation.querySelectorAll('[data-player]')).toHaveLength(11);
    const insights = screen.getByTestId('preview-insights');
    expect(insights.querySelectorAll('[data-bar]')).toHaveLength(8);
  });

  it('renders static content under prefers-reduced-motion (SC-LAND-8)', () => {
    const reduceMedia = {
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList;
    const matchMediaSpy = vi
      .spyOn(window, 'matchMedia')
      .mockReturnValue(reduceMedia);

    renderLanding();

    expect(
      screen.getByRole('heading', {
        name: 'Administrá tus equipos de fútbol: entrenamientos, formaciones y datos con IA',
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Entrenamientos' })).toBeInTheDocument();
    expect(screen.getByTestId('preview-training')).toBeInTheDocument();

    matchMediaSpy.mockRestore();
  });

  it('renders the footer with copyright and no login link (SC-LAND-10)', () => {
    renderLanding();

    expect(
      screen.getByText(`© ${new Date().getFullYear()} FutbolApp`),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /iniciar sesión/i }),
    ).not.toBeInTheDocument();
  });

  it('redirects authenticated users to /dashboard without flashing the landing (SC-LAND-2, 13)', () => {
    useAuthStore.setState({
      user: mockUser,
      accessToken: 'stored-token',
      isLoading: false,
      error: null,
    });
    mockAuth0State({
      isAuthenticated: true,
      user: { sub: 'u1', email: mockUser.email, name: mockUser.name },
    });

    renderLanding();

    expect(screen.getByText('dashboard stub')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        name: 'Administrá tus equipos de fútbol: entrenamientos, formaciones y datos con IA',
      }),
    ).not.toBeInTheDocument();
  });
});
