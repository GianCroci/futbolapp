import '@testing-library/jest-dom/vitest';

/**
 * Test environment shims for jsdom gaps.
 *
 * jsdom does not implement IntersectionObserver or window.matchMedia. motion's
 * `whileInView` needs IntersectionObserver; the landing's reduced-motion toggle
 * needs matchMedia. Both stubs are registered here so component tests can run
 * without mocking them per file.
 */

class IntersectionObserverStub implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '0px';
  readonly thresholds: ReadonlyArray<number> = [0];

  constructor(private readonly callback: IntersectionObserverCallback) {}

  observe(target: Element): void {
    // Fire immediately with isIntersecting: true so scroll-triggered reveals
    // (motion `whileInView`) activate synchronously in tests.
    this.callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this);
  }

  unobserve(): void {}

  disconnect(): void {}

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

window.IntersectionObserver = IntersectionObserverStub as unknown as typeof IntersectionObserver;

class MediaQueryListStub {
  readonly media: string;
  matches: boolean;
  onchange: ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown) | null = null;

  private readonly listeners = new Set<(ev: MediaQueryListEvent) => void>();

  constructor(query: string, matches = false) {
    this.media = query;
    this.matches = matches;
  }

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    _options?: boolean | AddEventListenerOptions,
  ): void {
    if (type === 'change' && listener) {
      this.listeners.add(listener as (ev: MediaQueryListEvent) => void);
    }
  }

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    _options?: boolean | EventListenerOptions,
  ): void {
    if (type === 'change' && listener) {
      this.listeners.delete(listener as (ev: MediaQueryListEvent) => void);
    }
  }

  addListener(listener: (this: MediaQueryList, ev: MediaQueryListEvent) => unknown): void {
    this.listeners.add(listener as (ev: MediaQueryListEvent) => void);
  }

  removeListener(listener: (this: MediaQueryList, ev: MediaQueryListEvent) => unknown): void {
    this.listeners.delete(listener as (ev: MediaQueryListEvent) => void);
  }

  dispatchEvent(event: Event): boolean {
    if (event.type === 'change') {
      this.matches = (event as MediaQueryListEvent).matches;
      for (const listener of [...this.listeners]) {
        listener.call(this, event as MediaQueryListEvent);
      }
    }
    return true;
  }
}

// Default to no-preference (matches: false) so animations run in tests.
// Tests simulate reduced motion by setting `.matches = true` and dispatching a
// change event (SC-LAND-8), or by replacing the stub entirely.
window.matchMedia = (query: string): MediaQueryList =>
  new MediaQueryListStub(query, false) as unknown as MediaQueryList;
