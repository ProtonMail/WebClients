import '@proton/vitest-config/setup';
import '@proton/app-context/testing/mockTelemetry';
import '@proton/components/testing/mockFlagSvg';
import '@proton/components/testing/mockMatchMedia';
import '@proton/unleash/testing/mockUnleash';

window.ResizeObserver = class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
} as unknown as typeof ResizeObserver;

vi.mock('@protontech/bip39', () => ({
    default: () => null,
}));
