import {
    CreateCalendarEventSyncData,
    CreateLinkedCalendarEventsSyncData,
    DeleteCalendarEventSyncData,
    syncMultipleEvents as syncMultipleEventsRoute,
    UpdateCalendarEventSyncData,
} from 'proton-shared/lib/api/calendars';
import getCreationKeys from 'proton-shared/lib/calendar/integration/getCreationKeys';
import {
    createCalendarEvent,
    getHasSharedEventContent,
    getHasSharedKeyPacket,
} from 'proton-shared/lib/calendar/serialize';
import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar/Event';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { useGetAddressKeys } from 'react-components';
import { useGetCalendarKeys } from 'react-components/hooks/useGetDecryptedPassphraseAndCalendarKeys';

export enum SyncOperationTypes {
    DELETE,
    UPDATE,
    CREATE,
}

export interface DeleteEventActionOperation {
    type: SyncOperationTypes.DELETE;
    data: {
        Event: CalendarEvent;
    };
}
export interface CreateEventActionOperation {
    type: SyncOperationTypes.CREATE;
    data: {
        veventComponent: VcalVeventComponent;
    };
}
export interface UpdateEventActionOperation {
    type: SyncOperationTypes.UPDATE;
    data: {
        Event: CalendarEvent;
        veventComponent: VcalVeventComponent;
        removedAttendees: string[];
    };
}

export type SyncEventActionOperation =
    | CreateEventActionOperation
    | UpdateEventActionOperation
    | DeleteEventActionOperation;

export interface SyncEventActionOperations {
    calendarID: string;
    addressID: string;
    memberID: string;
    operations: SyncEventActionOperation[];
}

interface SyncMultipleEventsArguments {
    sync: SyncEventActionOperations;
    getCalendarKeys: ReturnType<typeof useGetCalendarKeys>;
    getAddressKeys: ReturnType<typeof useGetAddressKeys>;
}

export const getIsDeleteSyncOperation = (
    operation: SyncEventActionOperation
): operation is DeleteEventActionOperation => operation.type === SyncOperationTypes.DELETE;
export const getIsUpdateSyncOperation = (
    operation: SyncEventActionOperation
): operation is UpdateEventActionOperation => operation.type === SyncOperationTypes.UPDATE;
export const getIsCreateSyncOperation = (
    operation: SyncEventActionOperation
): operation is CreateEventActionOperation => operation.type === SyncOperationTypes.CREATE;

export const getCreateSyncOperation = (veventComponent: VcalVeventComponent): CreateEventActionOperation => ({
    type: SyncOperationTypes.CREATE,
    data: { veventComponent },
});
export const getUpdateSyncOperation = (
    veventComponent: VcalVeventComponent,
    Event: CalendarEvent,
    removedAttendees: string[] = []
): UpdateEventActionOperation => ({
    type: SyncOperationTypes.UPDATE,
    data: { veventComponent, Event, removedAttendees },
});

export const getDeleteSyncOperation = (Event: CalendarEvent): DeleteEventActionOperation => ({
    type: SyncOperationTypes.DELETE,
    data: { Event },
});

const getRequiredKeys = ({
    sync: { operations, calendarID, addressID },
    getCalendarKeys,
    getAddressKeys,
}: SyncMultipleEventsArguments) => {
    const allCalendarIDs = operations.reduce<Set<string>>((acc, operation) => {
        // No key needed for delete.
        if (getIsDeleteSyncOperation(operation)) {
            return acc;
        }
        if (getIsUpdateSyncOperation(operation)) {
            const oldCalendarID = operation.data.Event.CalendarID;
            const isSwitchCalendar = oldCalendarID !== calendarID;
            if (isSwitchCalendar && oldCalendarID) {
                acc.add(oldCalendarID);
            }
        }
        acc.add(calendarID);
        return acc;
    }, new Set([calendarID]));

    const getKeysMap = async <T>(set: Set<string>, cb: (id: string) => Promise<T[]>) => {
        const ids = [...set];

        const result = await Promise.all(ids.map(cb));

        return ids.reduce<{ [id: string]: T[] }>((acc, id, i) => {
            acc[id] = result[i];
            return acc;
        }, {});
    };

    return Promise.all([getKeysMap(allCalendarIDs, getCalendarKeys), getKeysMap(new Set([addressID]), getAddressKeys)]);
};

const getSyncMultipleEventsPayload = async ({ getAddressKeys, getCalendarKeys, sync }: SyncMultipleEventsArguments) => {
    const [calendarKeysMap, addressKeysMap] = await getRequiredKeys({ sync, getCalendarKeys, getAddressKeys });

    const { operations, calendarID, memberID, addressID } = sync;

    const payloadPromise = operations.map(
        async (
            operation
        ): Promise<
            | DeleteCalendarEventSyncData
            | CreateCalendarEventSyncData
            | UpdateCalendarEventSyncData
            | CreateLinkedCalendarEventsSyncData
        > => {
            if (getIsDeleteSyncOperation(operation)) {
                return { ID: operation.data.Event.ID };
            }

            const { veventComponent } = operation.data;

            const newCalendarKeys = calendarKeysMap[calendarID];
            const addressKeys = addressKeysMap[addressID];

            const permissionData = {
                Permissions: 3,
            };

            if (getIsCreateSyncOperation(operation)) {
                const data = await createCalendarEvent({
                    eventComponent: veventComponent,
                    isCreateEvent: true,
                    isSwitchCalendar: false,
                    ...(await getCreationKeys({ addressKeys, newCalendarKeys })),
                });

                const dataComplete = {
                    ...permissionData,
                    ...data,
                };

                if (!getHasSharedKeyPacket(dataComplete) || !getHasSharedEventContent(dataComplete)) {
                    throw new Error('Missing shared data');
                }

                return {
                    Overwrite: 0,
                    Event: dataComplete,
                };
            }

            if (getIsUpdateSyncOperation(operation)) {
                const { Event, removedAttendees } = operation.data;

                const oldCalendarID = Event.CalendarID;
                const isSwitchCalendar = oldCalendarID !== calendarID;

                const oldCalendarKeys = isSwitchCalendar && oldCalendarID ? calendarKeysMap[oldCalendarID] : undefined;

                const data = await createCalendarEvent({
                    eventComponent: veventComponent,
                    removedAttendees,
                    isCreateEvent: false,
                    isSwitchCalendar,
                    isInvitation: !Event.IsOrganizer,
                    ...(await getCreationKeys({ Event, addressKeys, newCalendarKeys, oldCalendarKeys })),
                });
                const isOrganizerData = { IsOrganizer: operation.data.Event.IsOrganizer };

                const dataComplete = {
                    ...permissionData,
                    ...isOrganizerData,
                    ...data,
                };

                if (isSwitchCalendar) {
                    if (!getHasSharedKeyPacket(dataComplete)) {
                        throw new Error('Missing shared key packet');
                    }
                    return {
                        Event: {
                            ...dataComplete,
                            UID: veventComponent.uid.value,
                            SharedEventID: Event.SharedEventID,
                        },
                    };
                }

                if (!getHasSharedEventContent(dataComplete)) {
                    throw new Error('Missing shared event content');
                }

                return {
                    ID: Event.ID,
                    Event: dataComplete,
                };
            }

            throw new Error('Unknown operation');
        }
    );

    return syncMultipleEventsRoute(calendarID, {
        MemberID: memberID,
        Events: await Promise.all(payloadPromise),
    });
};

export default getSyncMultipleEventsPayload;
