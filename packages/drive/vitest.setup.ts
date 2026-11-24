import * as webStreams from 'node:stream/web';

import '@proton/app-context/testing/mockTelemetry';

// The vm context of the test pool does not expose these Node globals (the drive SDK needs them)
(['TransformStream', 'ReadableStream', 'WritableStream'] as const).forEach((name) => {
    if (!(name in globalThis)) {
        (globalThis as any)[name] = (webStreams as any)[name];
    }
});

if (typeof document !== 'undefined') {
    await import('@proton/vitest-config/setup');
    await import('@proton/components/testing/mockFlagSvg');
    // @ts-expect-error the module only has side effects
    await import('@proton/components/testing/mockMatchMedia');
    const { cleanup } = await import('@testing-library/react');

    afterEach(cleanup);

    globalThis.ResizeObserver = class {
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
    };
}

// Suppress console noise from drive-sdk telemetry during tests.
vi.spyOn(console, 'debug').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});
