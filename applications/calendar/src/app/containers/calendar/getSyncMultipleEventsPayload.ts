import { useGetCalendarKeys, useGetAddressKeys } from 'react-components';
import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar/Event';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { CachedKey } from 'proton-shared/lib/interfaces';
import { createCalendarEvent } from 'proton-shared/lib/calendar/serialize';
import { syncMultipleEvents as syncMultipleEventsRoute } from 'proton-shared/lib/api/calendars';
import getCreationKeys from './getCreationKeys';

export enum SyncOperationTypes {
    DELETE,
    UPDATE,
    CREATE
}

interface SyncMultipleEventsOperation {
    type: SyncOperationTypes;
    data: {
        Event?: CalendarEvent;
        veventComponent?: VcalVeventComponent;
    };
}

export interface SyncMultipleEventsOperations {
    memberID: string;
    addressID: string;
    calendarID: string;
    operations: SyncMultipleEventsOperation[];
}

interface SyncMultipleEventsArguments {
    sync: SyncMultipleEventsOperations;
    getCalendarKeys: ReturnType<typeof useGetCalendarKeys>;
    getAddressKeys: ReturnType<typeof useGetAddressKeys>;
}

const getRequiredKeys = ({
    sync: { operations, calendarID, addressID },
    getCalendarKeys,
    getAddressKeys
}: SyncMultipleEventsArguments) => {
    const allCalendarIDs = operations.reduce<Set<string>>((acc, { type, data: { Event } }) => {
        // No key needed for delete.
        if (type === SyncOperationTypes.DELETE) {
            return acc;
        }

        const oldCalendarID = Event?.CalendarID;
        const isSwitchCalendar = !!Event && oldCalendarID !== calendarID;

        if (isSwitchCalendar && oldCalendarID) {
            acc.add(oldCalendarID);
        }

        return acc;
    }, new Set([calendarID]));

    const getKeysMap = async (set: Set<string>, cb: (id: string) => Promise<CachedKey[]>) => {
        const ids = [...set];

        const result = await Promise.all(ids.map(cb));

        return ids.reduce<{ [id: string]: CachedKey[] }>((acc, id, i) => {
            acc[id] = result[i];
            return acc;
        }, {});
    };

    return Promise.all([getKeysMap(allCalendarIDs, getCalendarKeys), getKeysMap(new Set([addressID]), getAddressKeys)]);
};

const getSyncMultipleEventsPayload = async ({ getAddressKeys, getCalendarKeys, sync }: SyncMultipleEventsArguments) => {
    const [calendarKeysMap, addressKeysMap] = await getRequiredKeys({ sync, getCalendarKeys, getAddressKeys });

    const { operations, calendarID, memberID, addressID } = sync;

    const payloadPromise = operations.map(async ({ type, data: { Event, veventComponent } }) => {
        if (type === SyncOperationTypes.DELETE) {
            if (!Event) {
                throw new Error('Missing Event');
            }
            return {
                ID: Event.ID
            };
        }

        const oldCalendarID = Event?.CalendarID;
        const isUpdateEvent = !!Event;
        const isSwitchCalendar = isUpdateEvent && oldCalendarID !== calendarID;

        if (isSwitchCalendar) {
            throw new Error('Can currently not change calendar with the sync operation');
        }

        const newCalendarKeys = calendarKeysMap[calendarID];
        const oldCalendarKeys = isSwitchCalendar && oldCalendarID ? calendarKeysMap[oldCalendarID] : undefined;
        const addressKeys = addressKeysMap[addressID];

        const data = await createCalendarEvent({
            eventComponent: veventComponent,
            isSwitchCalendar,
            ...(await getCreationKeys({ Event, addressKeys, newCalendarKeys, oldCalendarKeys }))
        });

        const dataComplete = {
            Permissions: 3,
            ...data
        };

        if (isUpdateEvent) {
            if (!Event) {
                throw new Error('Missing event');
            }
            return {
                ID: Event.ID,
                Event: dataComplete
            };
        }

        return {
            Event: dataComplete
        };
    });

    return syncMultipleEventsRoute(calendarID, {
        MemberID: memberID,
        Events: await Promise.all(payloadPromise)
    });
};

export default getSyncMultipleEventsPayload;
