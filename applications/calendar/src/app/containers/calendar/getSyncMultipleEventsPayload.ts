import { DEFAULT_ATTENDEE_PERMISSIONS } from '@proton/shared/lib/calendar/constants';
import { SimpleMap } from '@proton/shared/lib/interfaces';
import {
    CreateCalendarEventSyncData,
    CreateLinkedCalendarEventsSyncData,
    DeleteCalendarEventSyncData,
    UpdateCalendarEventSyncData,
} from '@proton/shared/lib/interfaces/calendar/Api';
import { syncMultipleEvents as syncMultipleEventsRoute } from '@proton/shared/lib/api/calendars';
import getCreationKeys from '@proton/shared/lib/calendar/integration/getCreationKeys';
import {
    createCalendarEvent,
    getHasSharedEventContent,
    getHasSharedKeyPacket,
} from '@proton/shared/lib/calendar/serialize';
import { CalendarEvent } from '@proton/shared/lib/interfaces/calendar';
import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';
import { useGetAddressKeys } from '@proton/components';
import { useGetCalendarKeys } from '@proton/components/hooks/useGetDecryptedPassphraseAndCalendarKeys';
import { OpenPGPKey } from 'pmcrypto';

export enum SyncOperationTypes {
    DELETE,
    UPDATE,
    CREATE,
}

export interface DeleteEventActionOperation {
    type: SyncOperationTypes.DELETE;
    data: {
        calendarEvent: CalendarEvent;
    };
}
export interface CreateEventActionOperation {
    type: SyncOperationTypes.CREATE;
    data: {
        veventComponent: VcalVeventComponent;
        addedAttendeesPublicKeysMap?: SimpleMap<OpenPGPKey>;
    };
}
export interface UpdateEventActionOperation {
    type: SyncOperationTypes.UPDATE;
    data: {
        calendarEvent: CalendarEvent;
        veventComponent: VcalVeventComponent;
        removedAttendeesEmails?: string[];
        addedAttendeesPublicKeysMap?: SimpleMap<OpenPGPKey>;
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

export interface SyncMultipleEventsArguments {
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

export const getCreateSyncOperation = (data: {
    veventComponent: VcalVeventComponent;
    addedAttendeesPublicKeysMap?: SimpleMap<OpenPGPKey>;
}): CreateEventActionOperation => ({
    type: SyncOperationTypes.CREATE,
    data,
});
export const getUpdateSyncOperation = (data: {
    veventComponent: VcalVeventComponent;
    calendarEvent: CalendarEvent;
    removedAttendeesEmails?: string[];
    addedAttendeesPublicKeysMap?: SimpleMap<OpenPGPKey>;
}): UpdateEventActionOperation => ({
    type: SyncOperationTypes.UPDATE,
    data,
});

export const getDeleteSyncOperation = (calendarEvent: CalendarEvent): DeleteEventActionOperation => ({
    type: SyncOperationTypes.DELETE,
    data: { calendarEvent },
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
            const oldCalendarID = operation.data.calendarEvent.CalendarID;
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
                return { ID: operation.data.calendarEvent.ID };
            }

            const { veventComponent } = operation.data;

            const newCalendarKeys = calendarKeysMap[calendarID];
            const addressKeys = addressKeysMap[addressID];

            const permissionData = {
                Permissions: DEFAULT_ATTENDEE_PERMISSIONS,
            };

            if (getIsCreateSyncOperation(operation)) {
                const { addedAttendeesPublicKeysMap } = operation.data;

                const data = await createCalendarEvent({
                    eventComponent: veventComponent,
                    isCreateEvent: true,
                    isSwitchCalendar: false,
                    addedAttendeesPublicKeysMap,
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
                const { calendarEvent, removedAttendeesEmails, addedAttendeesPublicKeysMap } = operation.data;

                const oldCalendarID = calendarEvent.CalendarID;
                const isSwitchCalendar = oldCalendarID !== calendarID;

                const oldCalendarKeys = isSwitchCalendar && oldCalendarID ? calendarKeysMap[oldCalendarID] : undefined;

                const data = await createCalendarEvent({
                    eventComponent: veventComponent,
                    removedAttendeesEmails,
                    addedAttendeesPublicKeysMap,
                    isCreateEvent: false,
                    isSwitchCalendar,
                    isInvitation: !calendarEvent.IsOrganizer,
                    ...(await getCreationKeys({ calendarEvent, addressKeys, newCalendarKeys, oldCalendarKeys })),
                });
                const isOrganizerData = { IsOrganizer: operation.data.calendarEvent.IsOrganizer };

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
                            SourceCalendarID: oldCalendarID,
                            UID: veventComponent.uid.value,
                            SharedEventID: calendarEvent.SharedEventID,
                        },
                    };
                }

                if (!getHasSharedEventContent(dataComplete)) {
                    throw new Error('Missing shared event content');
                }

                return {
                    ID: calendarEvent.ID,
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
