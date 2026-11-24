import '@proton/vitest-config/setup';
import '@proton/unleash/testing/vitest/mockUnleash';

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
