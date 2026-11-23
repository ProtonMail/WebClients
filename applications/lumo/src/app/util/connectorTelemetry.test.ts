import type { Mock } from 'vitest';

import { telemetry } from '@proton/shared/lib/telemetry';

import { initDesktopConnectorTelemetry } from './connectorTelemetry';
import { setLumoTelemetryEnabled } from './telemetry';

vi.mock('@proton/shared/lib/telemetry', () => {
    return { telemetry: { sendCustomEvent: vi.fn() } };
});

const sendCustomEvent = telemetry.sendCustomEvent as Mock;

describe('connector telemetry', () => {
    beforeEach(() => {
        sendCustomEvent.mockClear();
        setLumoTelemetryEnabled(true);
    });

    afterEach(() => {
        setLumoTelemetryEnabled(false);
    });

    it('turns the desktop add and remove signals into events, ignoring unknown kinds', () => {
        initDesktopConnectorTelemetry();
        initDesktopConnectorTelemetry();

        window.dispatchEvent(new CustomEvent('lumo:connector-added', { detail: { kind: 'mcp' } }));
        window.dispatchEvent(new CustomEvent('lumo:connector-removed', { detail: { kind: 'catalog' } }));
        window.dispatchEvent(new CustomEvent('lumo:connector-added', { detail: { kind: 'gmail' } }));
        window.dispatchEvent(new CustomEvent('lumo:connector-added'));

        expect(sendCustomEvent.mock.calls).toEqual([
            ['lumo-connector-added', { kind: 'mcp' }],
            ['lumo-connector-removed', { kind: 'catalog' }],
        ]);
    });
});
