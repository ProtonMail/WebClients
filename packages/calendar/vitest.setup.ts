import '@testing-library/jest-dom/vitest';
import '@proton/app-context/testing/vitest/mockTelemetry';
import '@proton/unleash/testing/vitest/mockUnleash';
import './testing/setup/mockFlagSvg';
import './testing/setup/mockMatchMedia';

window.ResizeObserver = class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
} as unknown as typeof ResizeObserver;

vi.mock('@protontech/bip39', () => ({
    default: () => null,
}));
