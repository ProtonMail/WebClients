import '@proton/vitest-config/setup';
import '@proton/unleash/testing/mockUnleash';

if (typeof window !== 'undefined') {
    await import('@proton/components/testing/mockFlagSvg');
    // @ts-expect-error side-effect-only module without exports
    await import('@proton/components/testing/mockMatchMedia');

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
