import '@proton/vitest-config/setup';

window.ResizeObserver = vi.fn().mockImplementation(function () {
    return {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
    };
}) as any;
