import type { Mock } from 'vitest';

import { telemetry } from '@proton/shared/lib/telemetry';

import {
    sendScheduleCreatedEvent,
    sendScheduleDeletedEvent,
    sendScheduleDraftedInChatEvent,
    setLumoTelemetryEnabled,
} from './telemetry';

vi.mock('@proton/shared/lib/telemetry', () => {
    return { telemetry: { sendCustomEvent: vi.fn() } };
});

const sendCustomEvent = telemetry.sendCustomEvent as Mock;

describe('scheduled task telemetry', () => {
    beforeEach(() => {
        sendCustomEvent.mockClear();
        setLumoTelemetryEnabled(true);
    });

    afterEach(() => {
        setLumoTelemetryEnabled(false);
    });

    it.each(['blank', 'template', 'chat'] as const)('sends the %s source with lumo-schedule-created', (source) => {
        sendScheduleCreatedEvent({ source });

        expect(sendCustomEvent).toHaveBeenCalledWith('lumo-schedule-created', { source });
    });

    it('sends drafts and deletes without extra data', () => {
        sendScheduleDraftedInChatEvent();
        sendScheduleDeletedEvent();

        expect(sendCustomEvent.mock.calls).toEqual([
            ['lumo-schedule-drafted-in-chat', {}],
            ['lumo-schedule-deleted', {}],
        ]);
    });
});
