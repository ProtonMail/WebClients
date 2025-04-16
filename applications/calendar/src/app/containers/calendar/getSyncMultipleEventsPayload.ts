import type { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import type { useGetCalendarKeys } from '@proton/calendar/calendarBootstrap/keys';
import type { PublicKeyReference, SessionKey } from '@proton/crypto';
import { syncMultipleEvents as syncMultipleEventsRoute } from '@proton/shared/lib/api/calendars';
import { getHasSharedEventContent, getHasSharedKeyPacket } from '@proton/shared/lib/calendar/apiModels';
import { DEFAULT_ATTENDEE_PERMISSIONS } from '@proton/shared/lib/calendar/constants';
import { getCreationKeys } from '@proton/shared/lib/calendar/crypto/keys/helpers';
import { createCalendarEvent } from '@proton/shared/lib/calendar/serialize';
import { getVeventColorValue, withoutRedundantDtEnd } from '@proton/shared/lib/calendar/veventHelper';
import { booleanToNumber } from '@proton/shared/lib/helpers/boolean';
import type { SimpleMap } from '@proton/shared/lib/interfaces';
import type { AttendeeComment, CalendarEvent } from '@proton/shared/lib/interfaces/calendar';
import type {
    CreateCalendarEventSyncData,
    CreateLinkedCalendarEventsSyncData,
    DeleteCalendarEventSyncData,
    UpdateCalendarEventSyncData,
} from '@proton/shared/lib/interfaces/calendar/Api';
import { DELETION_REASON } from '@proton/shared/lib/interfaces/calendar/Api';
import type { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';

export enum SyncOperationTypes {
    DELETE,
    UPDATE,
    CREATE,
}

export interface DeleteEventActionOperation {
    type: SyncOperationTypes.DELETE;
    data: {
        calendarEvent: CalendarEvent;
        deletionReason: DELETION_REASON;
    };
}

export interface CreateEventActionOperation {
    type: SyncOperationTypes.CREATE;
    data: {
        veventComponent: VcalVeventComponent;
        hasDefaultNotifications: boolean;
        isCancellingSingleOccurrence?: boolean;
        addedAttendeesPublicKeysMap?: SimpleMap<PublicKeyReference>;
        isPersonalSingleEdit?: boolean;
        color?: string;
    };
}

export interface UpdateEventActionOperation {
    type: SyncOperationTypes.UPDATE;
    data: {
        calendarEvent: CalendarEvent;
        veventComponent: VcalVeventComponent;
        cancelledOccurrenceVevent?: VcalVeventComponent;
        hasDefaultNotifications: boolean;
        isAttendee: boolean;
        isBreakingChange?: boolean;
        isPersonalSingleEdit?: boolean;
        removedAttendeesEmails?: string[];
        addedAttendeesPublicKeysMap?: SimpleMap<PublicKeyReference>;
        color?: string;
        resetNotes: boolean;
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
    getAttendeeEncryptedComment: (
        nextSessionKey: SessionKey | undefined,
        operation: CreateEventActionOperation | UpdateEventActionOperation
    ) => Promise<{ [attendeeToken: string]: AttendeeComment }>;
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
    hasDefaultNotifications: boolean;
    isPersonalSingleEdit?: boolean;
    addedAttendeesPublicKeysMap?: SimpleMap<PublicKeyReference>;
}): CreateEventActionOperation => ({
    type: SyncOperationTypes.CREATE,
    data: {
        ...data,
        veventComponent: withoutRedundantDtEnd(data.veventComponent),
        color: getVeventColorValue(data.veventComponent),
    },
});
export const getUpdateSyncOperation = (data: {
    veventComponent: VcalVeventComponent;
    cancelledOccurrenceVevent?: VcalVeventComponent;
    calendarEvent: CalendarEvent;
    hasDefaultNotifications: boolean;
    isAttendee: boolean;
    isPersonalSingleEdit?: boolean;
    isBreakingChange?: boolean;
    removedAttendeesEmails?: string[];
    addedAttendeesPublicKeysMap?: SimpleMap<PublicKeyReference>;
    resetNotes: boolean;
}): UpdateEventActionOperation => ({
    type: SyncOperationTypes.UPDATE,
    data: {
        ...data,
        veventComponent: withoutRedundantDtEnd(data.veventComponent),
        color: getVeventColorValue(data.veventComponent),
        cancelledOccurrenceVevent: data.cancelledOccurrenceVevent
            ? withoutRedundantDtEnd(data.cancelledOccurrenceVevent)
            : undefined,
    },
});

export const getDeleteSyncOperation = (
    calendarEvent: CalendarEvent,
    isSwitchCalendar = false
): DeleteEventActionOperation => ({
    type: SyncOperationTypes.DELETE,
    data: {
        calendarEvent,
        deletionReason: isSwitchCalendar ? DELETION_REASON.CHANGE_CALENDAR : DELETION_REASON.NORMAL,
    },
});

const getRequiredKeys = ({
    sync: { operations, calendarID, addressID },
    getCalendarKeys,
    getAddressKeys,
}: Omit<SyncMultipleEventsArguments, 'getAttendeeEncryptedComment'>) => {
    const allCalendarIDs = operations.reduce<Set<string>>(
        (acc, operation) => {
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
        },
        new Set([calendarID])
    );

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

const getSyncMultipleEventsPayload = async ({
    getAddressKeys,
    getCalendarKeys,
    sync,
    getAttendeeEncryptedComment,
}: SyncMultipleEventsArguments) => {
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
                return { ID: operation.data.calendarEvent.ID, DeletionReason: operation.data.deletionReason };
            }

            const { veventComponent } = operation.data;

            const newCalendarKeys = calendarKeysMap[calendarID];
            const newAddressKeys = addressKeysMap[addressID];

            const permissionData = {
                Permissions: DEFAULT_ATTENDEE_PERMISSIONS,
            };

            if (getIsCreateSyncOperation(operation)) {
                const { hasDefaultNotifications, addedAttendeesPublicKeysMap, isPersonalSingleEdit } = operation.data;

                const creationKeys = await getCreationKeys({ newAddressKeys, newCalendarKeys });

                const data = await createCalendarEvent({
                    eventComponent: veventComponent,
                    isCreateEvent: true,
                    isSwitchCalendar: false,
                    hasDefaultNotifications,
                    addedAttendeesPublicKeysMap,
                    getAttendeesCommentsMap: async (sharedSessionKey: SessionKey) => {
                        const eventCommentsMap = await getAttendeeEncryptedComment(sharedSessionKey, operation);
                        return eventCommentsMap;
                    },
                    ...creationKeys,
                });

                const isPersonalSingleEditData = {
                    IsPersonalSingleEdit: isPersonalSingleEdit ?? false,
                };
                const dataComplete = {
                    ...permissionData,
                    ...isPersonalSingleEditData,
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
                const {
                    calendarEvent,
                    hasDefaultNotifications,
                    isAttendee,
                    isBreakingChange,
                    isPersonalSingleEdit,
                    removedAttendeesEmails,
                    addedAttendeesPublicKeysMap,
                    cancelledOccurrenceVevent,
                } = operation.data;
                const {
                    CalendarID: oldCalendarID,
                    AddressID: oldAddressID,
                    SharedEventID: oldSharedEventID,
                    IsPersonalSingleEdit: oldIsPersonalSingleEdit,
                } = calendarEvent;

                const isSwitchCalendar = oldCalendarID !== calendarID;

                const oldAddressKeys = oldAddressID ? await getAddressKeys(oldAddressID) : undefined;
                const oldCalendarKeys = isSwitchCalendar && oldCalendarID ? calendarKeysMap[oldCalendarID] : undefined;

                const creationKeys = await getCreationKeys({
                    calendarEvent,
                    newAddressKeys,
                    oldAddressKeys,
                    newCalendarKeys,
                    oldCalendarKeys,
                });

                const data = await createCalendarEvent({
                    eventComponent: veventComponent,
                    cancelledOccurrenceVevent,
                    removedAttendeesEmails,
                    addedAttendeesPublicKeysMap,
                    isCreateEvent: false,
                    isSwitchCalendar,
                    hasDefaultNotifications,
                    isAttendee,
                    getAttendeesCommentsMap: async (sharedSessionKey: SessionKey) => {
                        const eventCommentsMap = await getAttendeeEncryptedComment(sharedSessionKey, operation);
                        return eventCommentsMap;
                    },
                    ...creationKeys,
                });
                const isOrganizerData = { IsOrganizer: booleanToNumber(!isAttendee) };
                const isBreakingChangeData = { IsBreakingChange: booleanToNumber(isBreakingChange || false) };
                const isPersonalSingleEditData = {
                    IsPersonalSingleEdit: isPersonalSingleEdit ?? oldIsPersonalSingleEdit,
                };

                const dataComplete = {
                    ...permissionData,
                    ...isOrganizerData,
                    ...isBreakingChangeData,
                    ...isPersonalSingleEditData,
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
                            SharedEventID: oldSharedEventID,
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
