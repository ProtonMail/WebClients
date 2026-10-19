/**
 * Lightweight stand-in for `@sentry/browser`, mocked globally in `jest.setup.js`.
 *
 * The real SDK takes several seconds of module loading across the suite, and tests never send
 * anything: our helpers in `@proton/shared/lib/helpers/sentry` skip Sentry on localhost, which
 * is jsdom's host. Our helpers still run for real, only the SDK is replaced.
 * A test that needs the real SDK can call `jest.unmock('@sentry/browser')`.
 */
const scope = {
    setTag: jest.fn(),
    setTags: jest.fn(),
    setExtra: jest.fn(),
    setExtras: jest.fn(),
    setLevel: jest.fn(),
    setContext: jest.fn(),
    setUser: jest.fn(),
    setTransactionName: jest.fn(),
    setFingerprint: jest.fn(),
};

const sentryBrowserMock = {
    init: jest.fn(),
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    addBreadcrumb: jest.fn(),
    configureScope: jest.fn((callback: (s: typeof scope) => void) => callback(scope)),
    withScope: jest.fn((callback: (s: typeof scope) => void) => callback(scope)),
    makeFetchTransport: jest.fn(),
    Integrations: {
        Breadcrumbs: jest.fn(),
    },
};

export default sentryBrowserMock;
