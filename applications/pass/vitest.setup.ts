import '@proton/vitest-config/setup';
import 'core-js/actual/typed-array/from-base64';
import 'core-js/actual/typed-array/from-hex';
import 'core-js/actual/typed-array/to-base64';
import 'core-js/actual/typed-array/to-hex';
import '@proton/components/testing/mockMatchMedia';
import '@proton/unleash/testing/mockUnleash';

/** `DESKTOP_BUILD` is a build-time constant: tests drive it as a writable global */
(globalThis as any).DESKTOP_BUILD = false;

// Do not start crypto worker pool, let the single tests setup/mock the CryptoProxy as needed
vi.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    __esModule: true,
    loadCryptoWorker: vi.fn(),
}));

vi.mock('loglevel', () => import('@proton/pass/testing/loglevel.mock'));
vi.mock('@proton/pass/lib/core/ui.proxy', async () => ({
    default: (await import('@proton/pass/testing/ui.proxy.mock')).default,
    preloadPassUI: async () => undefined,
}));
vi.mock('webextension-polyfill', () => ({ default: {} }));

// No extension to answer in tests: resolve right away instead of arming a 15s timeout
vi.mock(import('@proton/shared/lib/browser/extension'), async (importOriginal) => ({
    ...(await importOriginal()),
    sendExtensionMessage: vi.fn().mockResolvedValue({ type: 'error', error: 'No extension in tests' }),
}));
