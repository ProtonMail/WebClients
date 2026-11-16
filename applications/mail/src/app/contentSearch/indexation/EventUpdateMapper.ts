import { ES_SYNC_ACTIONS } from '@proton/encrypted-search/constants';
import type { ESEvent, ESItemEvent } from '@proton/encrypted-search/models/interfaces';

import { MAIL_EVENTLOOP_NAME } from '../../constants';
import type { ESBaseMessage } from '../../models/encryptedSearch';
import type { Logger } from '../utils/logger';
import type { EventUpdate, EventUpdateItem } from './worker/tasks/IncrementalIndexer';

/** Turns an event loop event into the update the incremental indexer applies to the index. */
export class EventUpdateMapper {
    constructor(private readonly logger: Logger) {}

    map(event: ESEvent<ESBaseMessage> | undefined): EventUpdate | undefined {
        if (!event || !event.Items?.length) {
            return undefined;
        }
        const eventID = event.eventsToStore[MAIL_EVENTLOOP_NAME];
        if (!eventID) {
            this.logger.warn('no event id in event loop update');
            return;
        }

        const updates: EventUpdateItem[] = [];
        for (const item of event.Items) {
            const update = this.mapItem(item);
            if (update) {
                updates.push(update);
            }
        }

        return updates.length ? { items: updates, eventID } : undefined;
    }

    private mapItem(item: ESItemEvent<ESBaseMessage>): EventUpdateItem | undefined {
        switch (item.Action) {
            case ES_SYNC_ACTIONS.DELETE:
                return { deleteId: item.ID };
            case ES_SYNC_ACTIONS.UPDATE_METADATA:
                if (!item.ItemMetadata) {
                    this.logger.error(
                        `received metadata update from event loop but metadata not present for message ${item.ID}`
                    );
                    return;
                }
                return { metadata: item.ItemMetadata };
            case ES_SYNC_ACTIONS.UPDATE_CONTENT:
            case ES_SYNC_ACTIONS.CREATE:
                if (!item.ItemMetadata) {
                    this.logger.error(
                        `received created or updated message from event loop but metadata not present for message ${item.ID}`
                    );
                    return;
                }
                return { metadata: item.ItemMetadata, fetchBodyId: item.ID };
            default:
                throw new Error(`Unknown action: ${item.Action}`);
        }
    }
}
