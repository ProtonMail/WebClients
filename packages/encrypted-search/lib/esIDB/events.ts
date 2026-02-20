import noop from '@proton/utils/noop';

import type { EventsObject } from '../models';
import { openESDB, safelyWriteToIDBAbsolutely } from './indexedDB';

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
        return;
    }

    for (const componentID in eventsObject) {
        await safelyWriteToIDBAbsolutely({
            value: eventsObject[componentID],
            key: componentID,
            storeName: 'events',
            esDB,
        }).catch(noop);
    }

    esDB.close();
};

/**
 * Add an event loop's last event ID to IDB
 */
export const addLastEvent = async (userID: string, componentID: string, eventID: string) => {
    const eventsObject: EventsObject = {};
    eventsObject[componentID] = eventID;
    return writeAllEvents(userID, eventsObject);
};

/**
 * Remove an event loop's last event ID from IDB
 */
export const removeLastEvent = async (userID: string, componentID: string) => {
    const esDB = await openESDB(userID);
    if (!esDB || !esDB.objectStoreNames.contains('events')) {
        return;
    }

    await esDB.delete('events', componentID);

    esDB.close();
};
