import { vi } from 'vitest';

vi.mock('@protontech/telemetry', () => ({
    ProtonTelemetry: vi.fn(function () {
        return {
            sendCustomEvent: vi.fn(),
            sendPageView: vi.fn(),
        };
    }),
}));
