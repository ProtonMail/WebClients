import '@testing-library/jest-dom/vitest';
// Node < 25 lacks Uint8Array.fromBase64
import 'core-js/actual/typed-array/from-base64';
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

const eventManagerMocks = vi.hoisted(() => ({
    subscribe: vi.fn(),
    call: vi.fn(),
    stop: vi.fn(),
    start: vi.fn(),
}));

vi.mock('@proton/components/hooks/useEventManager', () => {
    const result = () => eventManagerMocks;

    return { __esModule: true, default: Object.assign(result, eventManagerMocks) };
});

vi.mock('@proton/components/components/modalTwo/BackdropContainer', () => ({
    __esModule: true,
    default: () => null,
}));
