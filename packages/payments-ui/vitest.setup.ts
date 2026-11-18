import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';

import '@proton/app-context/testing/vitest/mockTelemetry';
import '@proton/components/testing/vitest/mockFlagSvg';
import '@proton/components/testing/vitest/mockMatchMedia';
import '@proton/unleash/testing/vitest/mockUnleash';

afterEach(cleanup);

global.ResizeObserver = class {
    observe = vi.fn();

    unobserve = vi.fn();

    disconnect = vi.fn();
} as unknown as typeof ResizeObserver;

// Do not start crypto worker pool, let the single tests setup/mock the CryptoProxy as needed
vi.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    loadCryptoWorker: vi.fn(),
}));

// Silence warnings triggered by emoji-mart
HTMLCanvasElement.prototype.getContext = vi.fn();

// Needed to render all the components that have PaymentMethodDetails in their trees
(window.SVGElement.prototype as any).getBBox = vi.fn().mockReturnValue({ width: 0 });

// Some components use the metrics API. If we don't mock it, tests might fail in a seemingly random manner,
// e.g. when the metrics batch is sent via fetch after the test finished.
// The metrics package has its own test coverage, so we don't need to test it here.
vi.mock('@proton/metrics/metricsInstance', () => ({
    default: new Proxy(
        {},
        {
            get: () => new Proxy(() => {}, { get: () => vi.fn(), apply: () => undefined }),
        }
    ),
}));

// Keep the module namespace spy-able (ESM namespaces are not configurable), tests use `vi.spyOn(useFlagModule, 'useFlag')`
vi.mock('@proton/unleash/useFlag', async () => ({
    ...(await vi.importActual<object>('@proton/unleash/useFlag')),
}));

// The amount inputs wait 500ms before checking, which every test that types an amount would pay in real time
vi.mock('@proton/hooks/useDebounceInput', async () => {
    const actual: any = await vi.importActual('@proton/hooks/useDebounceInput');
    return { default: <T>(value: T, delay = 500) => actual.default(value, Math.min(delay, 20)) };
});
