import { CachedItem, ESItemInfo, EventsObject } from '../models';
import { openESDB, safelyWriteToIDB } from './indexedDB';

/**
 * Read all events ID in the events table
 */
export const readAllLastEvents = async (userID: string) => {
    const result: EventsObject = {};

    const esDB = await openESDB(userID);
    if (!esDB) {
        return;
    }

    let cursor = await esDB.transaction('events').store.openCursor();

    while (cursor) {
        const { key, value } = cursor;
        if (value) {
            result[key] = value;
        }
        cursor = await cursor.continue();
    }

    esDB.close();
    return result;
};

/**
 * Read the last event ID in the events table for the given component
 */
export const readLastEvent = async (userID: string, componentID: string) => {
    const esDB = await openESDB(userID);
    if (!esDB) {
        return;
    }

    const result = esDB.get('events', componentID);
    esDB.close();
    return result;
};

/**
 * Write all event IDs for all the given components to the events table
 */
export const writeAllEvents = async (userID: string, eventsObject: EventsObject) => {
    const esDB = await openESDB(userID);
    if (!esDB || !esDB.objectStoreNames.contains('events')) {
        throw new Error('ESDB not initialised');
    }

    const tx = esDB.transaction('events', 'readwrite');
    await Promise.all(
        Object.keys(eventsObject).map((componentID) => tx.store.put(eventsObject[componentID], componentID))
    );
    await tx.done;
    esDB.close();
};

/**
 * Write all event IDs for all the given components to the events table,
 * while checking for storage quota
 */
export const writeAllEventsConditionally = async <ESItemMetadata>(
    userID: string,
    eventsObject: EventsObject,
    esCache: Map<string, CachedItem<ESItemMetadata, unknown>>,
    getItemInfo: (item: ESItemMetadata) => ESItemInfo
) => {
    const esDB = await openESDB(userID);
    if (!esDB || !esDB.objectStoreNames.contains('events')) {
        throw new Error('ESDB not initialised');
    }

    for (const componentID in eventsObject) {
        await safelyWriteToIDB<ESItemMetadata>(
            eventsObject[componentID],
            componentID,
            'events',
            esDB,
            esCache,
            getItemInfo
        );
    }

    esDB.close();
};
