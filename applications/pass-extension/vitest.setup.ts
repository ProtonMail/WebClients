import 'core-js/actual/typed-array/from-base64';
import 'core-js/actual/typed-array/from-hex';
import 'core-js/actual/typed-array/to-base64';
import 'core-js/actual/typed-array/to-hex';

/** Do not start crypto worker pool, let the single tests setup/mock the CryptoProxy as needed */
vi.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    __esModule: true,
    loadCryptoWorker: vi.fn(),
}));

vi.mock('@proton/pass/lib/core/ui.proxy');
vi.mock('loglevel', async () => ({ default: (await import('@proton/pass/testing/vitest/loglevel.mock')).default }));
vi.mock('webextension-polyfill', async () => ({
    default: (await import('./src/__mocks__/webextension-polyfill')).default,
}));

/** Testing Library only drives fake timers through a `jest` global */
(globalThis as any).jest = { advanceTimersByTime: vi.advanceTimersByTime };

(globalThis as any).VERSION = '0.0.1';
