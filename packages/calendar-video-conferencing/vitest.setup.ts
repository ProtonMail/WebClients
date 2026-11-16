import '@testing-library/jest-dom/vitest';
import '@proton/app-context/testing/vitest/mockTelemetry';
import '@proton/components/testing/vitest/mockFlagSvg';
import '@proton/components/testing/vitest/mockMatchMedia';
import '@proton/unleash/testing/vitest/mockUnleash';

window.ResizeObserver = class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
} as unknown as typeof ResizeObserver;

vi.mock('@protontech/bip39', () => ({
    default: () => null,
}));
