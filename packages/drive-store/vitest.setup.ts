import * as jestDomMatchers from '@testing-library/jest-dom/matchers';
// Node < 25 lacks Uint8Array.fromBase64/toHex
import 'core-js/actual/typed-array/from-base64';
import 'core-js/actual/typed-array/to-hex';

import '@proton/unleash/testing/vitest/mockUnleash';

// Not '@testing-library/jest-dom/vitest': it imports `vitest` from its own location, which can be another
// instance than the one running the tests (peer variants differ per package) and then breaks `rejects.toThrow`
expect.extend(jestDomMatchers);

if (typeof window !== 'undefined') {
    await import('@proton/components/testing/vitest/mockFlagSvg');
    // @ts-expect-error side-effect-only module without exports
    await import('@proton/components/testing/vitest/mockMatchMedia');

    window.ResizeObserver = class ResizeObserverMock {
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
    };
}

// Testing Library only advances fake timers through a `jest` global
// @ts-expect-error minimal shim
globalThis.jest = { advanceTimersByTime: vi.advanceTimersByTime };

// Do not start crypto worker pool, let the single tests setup/mock the CryptoProxy as needed
vi.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    __esModule: true,
    loadCryptoWorker: vi.fn(),
}));

vi.mock('./utils/metrics/userSuccessMetrics', () => ({
    userSuccessMetrics: {
        init: vi.fn(),
        mark: vi.fn(),
    },
}));
