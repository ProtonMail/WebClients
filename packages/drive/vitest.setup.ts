import * as webStreams from 'node:stream/web';

import '@proton/app-context/testing/vitest/mockTelemetry';

// The vm context of the test pool does not expose these Node globals (the drive SDK needs them)
(['TransformStream', 'ReadableStream', 'WritableStream'] as const).forEach((name) => {
    if (!(name in globalThis)) {
        (globalThis as any)[name] = (webStreams as any)[name];
    }
});

if (typeof document !== 'undefined') {
    await import('@testing-library/jest-dom/vitest');
    await import('@proton/components/testing/vitest/mockFlagSvg');
    // @ts-expect-error the module only has side effects
    await import('@proton/components/testing/vitest/mockMatchMedia');
    const { cleanup } = await import('@testing-library/react');

    afterEach(cleanup);

    globalThis.ResizeObserver = class {
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
    };
}

// Testing Library only drives fake timers through a `jest` global.
(globalThis as any).jest = { advanceTimersByTime: vi.advanceTimersByTime.bind(vi) };

// Suppress console noise from drive-sdk telemetry during tests.
vi.spyOn(console, 'debug').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});
