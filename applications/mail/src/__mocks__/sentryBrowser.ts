/**
 * Lightweight stand-in for `@sentry/browser`, mocked globally in `vitest.setup.ts`.
 *
 * The real SDK takes several seconds of module loading across the suite, and tests never send
 * anything: our helpers in `@proton/shared/lib/helpers/sentry` skip Sentry on localhost, which
 * is jsdom's host. Our helpers still run for real, only the SDK is replaced.
 * A test that needs the real SDK can call `vi.unmock('@sentry/browser')`.
 */
const scope = {
    setTag: vi.fn(),
    setTags: vi.fn(),
    setExtra: vi.fn(),
    setExtras: vi.fn(),
    setLevel: vi.fn(),
    setContext: vi.fn(),
    setUser: vi.fn(),
    setTransactionName: vi.fn(),
    setFingerprint: vi.fn(),
};

const sentryBrowserMock = {
    init: vi.fn(),
    captureException: vi.fn(),
    captureMessage: vi.fn(),
    addBreadcrumb: vi.fn(),
    configureScope: vi.fn((callback: (s: typeof scope) => void) => callback(scope)),
    withScope: vi.fn((callback: (s: typeof scope) => void) => callback(scope)),
    makeFetchTransport: vi.fn(),
    Integrations: {
        Breadcrumbs: vi.fn(),
    },
};

export default sentryBrowserMock;
