import '@testing-library/jest-dom/vitest';

window.ResizeObserver = vi.fn().mockImplementation(function () {
    return {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
    };
}) as any;
