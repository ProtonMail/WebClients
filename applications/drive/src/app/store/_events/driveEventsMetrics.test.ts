import metrics from '@proton/metrics';
import { EVENT_TYPES } from '@proton/shared/lib/drive/constants';
import type { DriveEventsResult } from '@proton/shared/lib/interfaces/drive/events';

import type { DriveEvent } from '.';
import type { EncryptedLink } from '../_links';
import { VolumeType } from '../_volumes';
import { EventsMetrics, countEventsPerType } from './driveEventsMetrics';

jest.mock('@proton/metrics', () => ({
    drive_sync_event_total: {
        increment: jest.fn(),
    },
    drive_sync_event_unecessary_total: {
        increment: jest.fn(),
    },
}));

describe('EventsMetrics', () => {
    let eventsMetrics: EventsMetrics;

    beforeEach(() => {
        eventsMetrics = new EventsMetrics();
        jest.clearAllMocks();
    });

    test('processed method adds events correctly', () => {
        const event: DriveEvent = {
            eventType: EVENT_TYPES.CREATE,
            encryptedLink: { volumeId: 'vol1', linkId: 'link1' } as EncryptedLink,
        };
        eventsMetrics.processed('event1', event);

        const state = (eventsMetrics as any).state;
        expect(state.get('vol1-event1')).toEqual({
            create: new Set(['link1']),
        });
    });

    test('batchStart method initializes events correctly', () => {
        const driveEvents: DriveEventsResult = {
            EventID: 'event1',
            Events: [
                { EventType: EVENT_TYPES.CREATE, Link: { LinkID: 'link1' } },
                { EventType: EVENT_TYPES.DELETE, Link: { LinkID: 'link2' } },
            ],
        } as DriveEventsResult;
        eventsMetrics.batchStart('vol1', driveEvents);

        const events = (eventsMetrics as any).events;
        expect(events.get('vol1-event1')).toEqual({
            create: new Set(['link1']),
            delete: new Set(['link2']),
            update: new Set(),
            update_metadata: new Set(),
        });
    });

    test('batchCompleted method processes batch correctly', () => {
        const driveEvents: DriveEventsResult = {
            EventID: 'event1',
            Events: [
                { EventType: EVENT_TYPES.CREATE, Link: { LinkID: 'link1' } },
                { EventType: EVENT_TYPES.DELETE, Link: { LinkID: 'link2' } },
            ],
        } as DriveEventsResult;
        eventsMetrics.batchStart('vol1', driveEvents);
        eventsMetrics.processed('event1', {
            eventType: EVENT_TYPES.CREATE,
            encryptedLink: { volumeId: 'vol1', linkId: 'link1' } as EncryptedLink,
        });
        eventsMetrics.batchCompleted('vol1', 'event1', VolumeType.own);

        expect(metrics.drive_sync_event_unecessary_total.increment).toHaveBeenCalledWith(
            { volumeType: VolumeType.own, eventType: 'delete' },
            1
        );
    });
});

describe('countEventsPerType', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('counts events correctly', () => {
        const driveEvents: DriveEventsResult = {
            Events: [
                { EventType: EVENT_TYPES.CREATE },
                { EventType: EVENT_TYPES.UPDATE },
                { EventType: EVENT_TYPES.UPDATE },
                { EventType: EVENT_TYPES.DELETE },
                { EventType: EVENT_TYPES.UPDATE_METADATA },
            ],
        } as DriveEventsResult;

        countEventsPerType(VolumeType.own, driveEvents);

        expect(metrics.drive_sync_event_total.increment).toHaveBeenCalledTimes(4);
        expect(metrics.drive_sync_event_total.increment).toHaveBeenCalledWith(
            { volumeType: VolumeType.own, eventType: 'create' },
            1
        );
        expect(metrics.drive_sync_event_total.increment).toHaveBeenCalledWith(
            { volumeType: VolumeType.own, eventType: 'update' },
            2
        );
        expect(metrics.drive_sync_event_total.increment).toHaveBeenCalledWith(
            { volumeType: VolumeType.own, eventType: 'delete' },
            1
        );
        expect(metrics.drive_sync_event_total.increment).toHaveBeenCalledWith(
            { volumeType: VolumeType.own, eventType: 'update_metadata' },
            1
        );
    });

    test('handles undefined events', () => {
        const driveEvents: DriveEventsResult = {} as DriveEventsResult;
        countEventsPerType(VolumeType.own, driveEvents);
        expect(metrics.drive_sync_event_total.increment).not.toHaveBeenCalled();
    });
});
