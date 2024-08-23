import 'core-js/actual/set/difference';

import metrics from '@proton/metrics';
import { EVENT_TYPES } from '@proton/shared/lib/drive/constants';
import type { DriveEventsResult } from '@proton/shared/lib/interfaces/drive/events';

import type { VolumeType } from '../_volumes';
import type { DriveEvent } from './interface';

const EVENT_METRICS = ['delete', 'create', 'update', 'update_metadata'] as const;

export function countEventsPerType(type: VolumeType, driveEvents: DriveEventsResult) {
    if (!driveEvents.Events) {
        return;
    }

    const deleteCount = driveEvents.Events.filter((event) => event.EventType === EVENT_TYPES.DELETE).length;
    if (deleteCount) {
        metrics.drive_sync_event_total.increment(
            {
                volumeType: type,
                eventType: EVENT_METRICS[EVENT_TYPES.DELETE],
            },
            deleteCount
        );
    }

    const createCount = driveEvents.Events.filter((event) => event.EventType === EVENT_TYPES.CREATE).length;
    if (createCount) {
        metrics.drive_sync_event_total.increment(
            {
                volumeType: type,
                eventType: EVENT_METRICS[EVENT_TYPES.CREATE],
            },
            createCount
        );
    }

    const updateCount = driveEvents.Events.filter((event) => event.EventType === EVENT_TYPES.UPDATE).length;
    if (updateCount) {
        metrics.drive_sync_event_total.increment(
            {
                volumeType: type,
                eventType: EVENT_METRICS[EVENT_TYPES.UPDATE],
            },
            updateCount
        );
    }

    const updateMetadata = driveEvents.Events.filter((event) => event.EventType === EVENT_TYPES.UPDATE_METADATA).length;
    if (updateMetadata) {
        metrics.drive_sync_event_total.increment(
            {
                volumeType: type,
                eventType: EVENT_METRICS[EVENT_TYPES.UPDATE_METADATA],
            },
            updateMetadata
        );
    }
}

type EVENT_METRICS_TYPE = (typeof EVENT_METRICS)[number];
type StateEvents = {
    [K in EVENT_METRICS_TYPE]?: Set<string>;
};
type ProcessMap = Map<string, StateEvents>;

export class EventsMetrics {
    private state: ProcessMap = new Map();

    private events: ProcessMap = new Map();

    processed(eventId: string, event: DriveEvent) {
        const { eventType, encryptedLink } = event;
        const { volumeId, linkId } = encryptedLink;
        const key = `${volumeId}-${eventId}`;
        const metricKey = EVENT_METRICS[eventType];
        const processedEvents = this.state.get(key) || {};
        if (!processedEvents[metricKey]) {
            processedEvents[metricKey] = new Set();
        }
        processedEvents[metricKey].add(linkId);
        this.state.set(key, processedEvents);
    }

    batchStart(volumeId: string, driveEvents: DriveEventsResult) {
        const key = `${volumeId}-${driveEvents.EventID}`;
        this.events.set(key, {
            delete: new Set(
                driveEvents.Events.filter((event) => event.EventType === EVENT_TYPES.DELETE).map(
                    (event) => event.Link.LinkID
                )
            ),
            create: new Set(
                driveEvents.Events.filter((event) => event.EventType === EVENT_TYPES.CREATE).map(
                    (event) => event.Link.LinkID
                )
            ),
            update: new Set(
                driveEvents.Events.filter((event) => event.EventType === EVENT_TYPES.UPDATE).map(
                    (event) => event.Link.LinkID
                )
            ),
            update_metadata: new Set(
                driveEvents.Events.filter((event) => event.EventType === EVENT_TYPES.UPDATE_METADATA).map(
                    (event) => event.Link.LinkID
                )
            ),
        });
    }

    batchCompleted(volumeId: string, eventId: string, type: VolumeType) {
        const key = `${volumeId}-${eventId}`;
        const batch = this.state.get(key) || {};
        const events = this.events.get(key) || {};
        this.processBatch(batch, events, type);
        this.state.delete(key);
        this.events.delete(key);
    }

    private processBatch(batch: StateEvents, events: StateEvents, type: VolumeType) {
        EVENT_METRICS.forEach((eventType) => {
            const processed = batch[eventType];
            const total = events[eventType];
            if (total !== undefined && total.size > 0) {
                const difference = total.difference(processed || new Set());
                if (difference.size) {
                    metrics.drive_sync_event_unecessary_total.increment(
                        {
                            volumeType: type,
                            eventType: eventType,
                        },
                        difference.size
                    );
                }
            }
        });
    }
}
