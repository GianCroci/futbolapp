import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuthStore } from '../../store/authStore';
import { LandingCTAButton } from './LandingCTAButton';

/**
 * SC-LAND-3 / SC-LAND-4: the Google CTA calls useAuth().login() (Auth0
 * loginWithRedirect, no reload) and shows disabled+spinner while the redirect
 * is in flight, with an inline es-AR error on failure. Auth0 is mocked per the
 * pattern in discovery #156 so the button is driven by its inputs.
 */
const { mockUseAuth0 } = vi.hoisted(() => ({ mockUseAuth0: vi.fn() }));

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => mockUseAuth0(),
}));

// useAuth() syncs the Auth0 profile to the server in the background; stub the
// API client so tests never issue a real network request.
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: { id: 'u1', email: 'ana@futbol.app', name: 'Ana', picture: null },
    }),
  },
}));

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

describe('LandingCTAButton (SC-LAND-3, SC-LAND-4: Google CTA login)', () => {
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

  it('renders the Google CTA and calls login() on click (SC-LAND-3)', async () => {
    const loginWithRedirect = vi.fn().mockResolvedValue(undefined);
    mockAuth0State({ loginWithRedirect });
    const user = userEvent.setup();

    render(<LandingCTAButton />);

    const button = screen.getByRole('button', {
      name: /iniciar sesión con google/i,
    });
    await user.click(button);

    expect(loginWithRedirect).toHaveBeenCalledTimes(1);
  });

  it('disables the button with a spinner while login is in flight (SC-LAND-4)', async () => {
    let resolveLogin!: () => void;
    const loginWithRedirect = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveLogin = resolve;
        }),
    );
    mockAuth0State({ loginWithRedirect });
    const user = userEvent.setup();

    render(<LandingCTAButton />);

    const button = screen.getByRole('button', {
      name: /iniciar sesión con google/i,
    });
    await user.click(button);

    expect(button).toBeDisabled();

    resolveLogin();
    await waitFor(() => expect(button).not.toBeDisabled());
  });

  it('shows the es-AR error message when login fails, landing intact (SC-LAND-4)', async () => {
    mockAuth0State({
      loginWithRedirect: vi.fn().mockRejectedValue(new Error('Auth0 redirect failed')),
    });
    const user = userEvent.setup();

    render(<LandingCTAButton />);

    await user.click(
      screen.getByRole('button', { name: /iniciar sesión con google/i }),
    );

    expect(
      await screen.findByText('No pudimos iniciar sesión. Probá de nuevo.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
