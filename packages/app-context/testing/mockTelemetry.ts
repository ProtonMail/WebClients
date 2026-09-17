jest.mock(
    '@protontech/telemetry',
    () => ({
        __esModule: true,
        ProtonTelemetry: jest.fn(() => ({
            sendCustomEvent: jest.fn(),
            sendPageView: jest.fn(),
        })),
    }),
    { virtual: true }
);
