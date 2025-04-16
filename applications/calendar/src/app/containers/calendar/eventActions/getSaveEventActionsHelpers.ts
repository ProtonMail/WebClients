import { ICAL_METHOD } from '@proton/shared/lib/calendar/constants';
import { getBase64SharedSessionKey } from '@proton/shared/lib/calendar/crypto/keys/helpers';
import { getSupportedStringValue } from '@proton/shared/lib/calendar/icsSurgery/vcal';
import { getInviteVeventWithUpdatedParstats } from '@proton/shared/lib/calendar/mailIntegration/invite';
import { getPropertyTzid } from '@proton/shared/lib/calendar/vcalHelper';
import { getIsAllDay } from '@proton/shared/lib/calendar/veventHelper';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { omit } from '@proton/shared/lib/helpers/object';
import type { RequireSome } from '@proton/shared/lib/interfaces';
import type { SyncMultipleApiResponse, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
import type { GetCalendarKeys } from '@proton/shared/lib/interfaces/hooks/GetCalendarKeys';

import type { EventOldData } from '../../../interfaces/EventData';
import type { InviteActions, OnSendPrefsErrors, SendIcs } from '../../../interfaces/Invite';
import { INVITE_ACTION_TYPES } from '../../../interfaces/Invite';
import type { SyncEventActionOperations } from '../getSyncMultipleEventsPayload';
import { getCreateSyncOperation, getUpdateSyncOperation } from '../getSyncMultipleEventsPayload';
import { getStartDateTimeMerged } from '../recurrence/getDateTimeMerged';
import {
    getAddedAttendeesPublicKeysMap,
    getAttendeesDiff,
    getCorrectedSaveInviteActions,
    getOrganizerDiff,
} from './inviteActions';

export const getOldDataHasVeventComponent = (
    eventData: EventOldData
): eventData is RequireSome<EventOldData, 'veventComponent'> => {
    return 'veventComponent' in eventData;
};

/**
 * Helper that saves in the DB an intermediate event without attendees, taking into account send preferences errors
 * in the process (i.e. removing attendees with send preferences errors when possible).
 *
 * This intermediate event is needed when creating invitations as we need to get a SharedEventID from the API
 * before sending out the ICS's
 */
export const createIntermediateEvent = async ({
    inviteActions,
    vevent,
    hasDefaultNotifications,
    calendarID,
    addressID,
    memberID,
    getCalendarKeys,
    onSendPrefsErrors,
    handleSyncActions,
}: {
    inviteActions: InviteActions;
    vevent: VcalVeventComponent;
    hasDefaultNotifications: boolean;
    calendarID: string;
    addressID: string;
    memberID: string;
    getCalendarKeys: GetCalendarKeys;
    onSendPrefsErrors: OnSendPrefsErrors;
    handleSyncActions: (actions: SyncEventActionOperations[]) => Promise<SyncMultipleApiResponse[]>;
}) => {
    const { inviteActions: cleanInviteActions, vevent: cleanVevent } = await onSendPrefsErrors({
        inviteActions,
        vevent,
    });

    const createIntermediateOperation = getCreateSyncOperation({
        veventComponent: omit(cleanVevent, ['attendee']),
        hasDefaultNotifications,
    });
    const syncIntermediateActions = [
        {
            calendarID,
            addressID,
            memberID,
            operations: [createIntermediateOperation],
        },
    ];

    const [
        {
            Responses: [
                {
                    Response: { Event: intermediateEvent },
                },
            ],
        },
    ] = await handleSyncActions(syncIntermediateActions);

    if (!intermediateEvent) {
        throw new Error('Failed to generate intermediate event');
    }

    const sharedSessionKey = await getBase64SharedSessionKey({
        calendarEvent: intermediateEvent,
        getCalendarKeys,
    });

    if (sharedSessionKey) {
        cleanInviteActions.sharedEventID = intermediateEvent.SharedEventID;
        cleanInviteActions.sharedSessionKey = sharedSessionKey;
    }

    return { intermediateEvent, vevent: cleanVevent, inviteActions: cleanInviteActions };
};

export const getCorrectedSendInviteData = async ({
    newVevent,
    oldVevent,
    inviteActions,
    hasModifiedDateTimes,
    onEquivalentAttendees,
    isCreatingSingleEdit,
}: {
    newVevent: VcalVeventComponent;
    oldVevent: VcalVeventComponent;
    inviteActions: InviteActions;
    hasModifiedDateTimes?: boolean;
    onEquivalentAttendees: (veventComponent: VcalVeventComponent, inviteActions: InviteActions) => Promise<void>;
    isCreatingSingleEdit?: boolean;
}) => {
    const correctedSaveInviteActions = getCorrectedSaveInviteActions({
        inviteActions,
        newVevent,
        oldVevent,
        hasModifiedDateTimes,
    });
    const isSendInviteType = [INVITE_ACTION_TYPES.SEND_INVITATION, INVITE_ACTION_TYPES.SEND_UPDATE].includes(
        correctedSaveInviteActions.type
    );
    if (isCreatingSingleEdit && isSendInviteType) {
        // We are creating a single edit, which is like creating a new event, not updating an existing one
        correctedSaveInviteActions.type = INVITE_ACTION_TYPES.SEND_INVITATION;
    }
    await onEquivalentAttendees(newVevent, correctedSaveInviteActions);

    const method = isSendInviteType ? ICAL_METHOD.REQUEST : undefined;
    const correctedVevent = getInviteVeventWithUpdatedParstats(newVevent, oldVevent, method);

    return { vevent: correctedVevent, inviteActions: correctedSaveInviteActions, isSendInviteType };
};

/**
 * Helper that produces the update sync operation needed when the organizer
 * creates a single edit for an invitation series.
 */
export const getUpdateInviteOperationWithIntermediateEvent = async ({
    inviteActions,
    vevent,
    oldVevent,
    hasDefaultNotifications,
    calendarID,
    addressID,
    memberID,
    getCalendarKeys,
    sendIcs,
    onSendPrefsErrors,
    handleSyncActions,
    isBreakingChange,
}: {
    inviteActions: InviteActions;
    vevent: VcalVeventComponent;
    oldVevent: VcalVeventComponent;
    hasDefaultNotifications: boolean;
    calendarID: string;
    addressID: string;
    memberID: string;
    getCalendarKeys: GetCalendarKeys;
    sendIcs: SendIcs;
    onSendPrefsErrors: OnSendPrefsErrors;
    isBreakingChange: boolean;
    handleSyncActions: (actions: SyncEventActionOperations[]) => Promise<SyncMultipleApiResponse[]>;
}) => {
    const {
        intermediateEvent,
        vevent: intermediateVevent,
        inviteActions: intermediateInviteActions,
    } = await createIntermediateEvent({
        inviteActions,
        vevent,
        hasDefaultNotifications,
        calendarID,
        addressID,
        memberID,
        getCalendarKeys,
        onSendPrefsErrors,
        handleSyncActions,
    });
    const {
        veventComponent: finalVevent,
        inviteActions: finalInviteActions,
        sendPreferencesMap,
    } = await sendIcs(
        {
            inviteActions: intermediateInviteActions,
            vevent: intermediateVevent,
            cancelVevent: oldVevent,
            noCheckSendPrefs: true,
        },
        // we pass the calendarID here as we want to call the event manager in case the operation fails
        calendarID
    );

    const addedAttendeesPublicKeysMap = getAddedAttendeesPublicKeysMap({
        veventComponent: finalVevent,
        inviteActions: finalInviteActions,
        sendPreferencesMap,
    });

    return getUpdateSyncOperation({
        veventComponent: finalVevent,
        calendarEvent: intermediateEvent,
        hasDefaultNotifications,
        isAttendee: false,
        addedAttendeesPublicKeysMap,
        resetNotes: isBreakingChange,
    });
};

export const getHasModifiedNotifications = (
    newVevent: VcalVeventComponent,
    oldVevent: Partial<VcalVeventComponent>
) => {
    if (newVevent.components === undefined && oldVevent.components === undefined) {
        return false;
    }
    if (
        newVevent.components?.length !== oldVevent.components?.length ||
        newVevent.components === undefined ||
        oldVevent.components === undefined
    ) {
        return true;
    }

    return !newVevent.components.every((newEventNotification) => {
        return oldVevent.components?.some((oldEventNotification) =>
            isDeepEqual(newEventNotification, oldEventNotification)
        );
    });
};

export const getUpdateSingleEditMergeVevent = (newVevent: VcalVeventComponent, oldVevent: VcalVeventComponent) => {
    const result: Partial<VcalVeventComponent> = {};

    const { addedOrganizer, removedOrganizer, hasModifiedOrganizer } = getOrganizerDiff(newVevent, oldVevent);
    if (hasModifiedOrganizer || removedOrganizer) {
        // should not happen
        throw new Error('Organizer modification detected');
    }

    const { addedAttendees, removedAttendees, hasModifiedRole } = getAttendeesDiff(newVevent, oldVevent);

    if (getSupportedStringValue(newVevent.summary) !== getSupportedStringValue(oldVevent.summary)) {
        result.summary = newVevent.summary || { value: '' };
    }
    if (getSupportedStringValue(newVevent.location) !== getSupportedStringValue(oldVevent.location)) {
        result.location = newVevent.location || { value: '' };
    }
    if (getSupportedStringValue(newVevent.description) !== getSupportedStringValue(oldVevent.description)) {
        result.description = newVevent.description || { value: '' };
    }
    if (addedOrganizer) {
        result.organizer = newVevent.organizer;
    }
    if (addedAttendees?.length || removedAttendees?.length || hasModifiedRole) {
        result.attendee = newVevent.attendee || [];
    }
    if (getSupportedStringValue(newVevent.color) !== getSupportedStringValue(oldVevent.color)) {
        result.color = newVevent.color || { value: '' };
    }
    if (getIsAllDay(newVevent) === getIsAllDay(oldVevent) && getHasModifiedNotifications(newVevent, oldVevent)) {
        result.components = newVevent.components;
    }

    if (getPropertyTzid(newVevent.dtstart) !== getPropertyTzid(oldVevent.dtstart)) {
        result.dtstart = newVevent.dtstart;
    }
    if (newVevent.dtend && oldVevent.dtend && getPropertyTzid(newVevent.dtend) !== getPropertyTzid(oldVevent.dtend)) {
        result.dtend = newVevent.dtend;
    }

    if (
        getSupportedStringValue(newVevent['x-pm-conference-id']) !==
        getSupportedStringValue(oldVevent['x-pm-conference-id'])
    ) {
        result['x-pm-conference-id'] = newVevent['x-pm-conference-id'];
    }

    if (
        getSupportedStringValue(newVevent['x-pm-conference-url']) !==
        getSupportedStringValue(oldVevent['x-pm-conference-url'])
    ) {
        result['x-pm-conference-url'] = newVevent['x-pm-conference-url'];
    }

    return result;
};

export const getUpdatedMainSeriesMergeEvent = (
    updatedVeventComponent: VcalVeventComponent,
    updateMainSeriesMergeVevent: Partial<VcalVeventComponent>
) => {
    const result: Partial<VcalVeventComponent> = {
        ...updateMainSeriesMergeVevent,
    };

    const { addedAttendees, removedAttendees, hasModifiedRole } = getAttendeesDiff(
        updatedVeventComponent,
        updateMainSeriesMergeVevent
    );
    if (addedAttendees?.length || removedAttendees?.length || hasModifiedRole) {
        result.attendee = updatedVeventComponent.attendee || [];
    }

    return result;
};

export const getHasNotificationsMergeUpdate = (
    vevent: VcalVeventComponent,
    mergeVevent: Partial<VcalVeventComponent>
) => {
    if (!mergeVevent.components) {
        return false;
    }
    return getHasModifiedNotifications(vevent, mergeVevent);
};

export const getHasPersonalMergeUpdate = (vevent: VcalVeventComponent, mergeVevent: Partial<VcalVeventComponent>) => {
    if (mergeVevent.color && getSupportedStringValue(vevent.color) !== getSupportedStringValue(mergeVevent.color)) {
        return true;
    }
    if (mergeVevent.components && getHasNotificationsMergeUpdate(vevent, mergeVevent)) {
        return true;
    }
    if (mergeVevent.dtstart && getPropertyTzid(vevent.dtstart) !== getPropertyTzid(mergeVevent.dtstart)) {
        return true;
    }
    if (vevent.dtend && mergeVevent.dtend && getPropertyTzid(vevent.dtend) !== getPropertyTzid(mergeVevent.dtend)) {
        return true;
    }
};

export const getHasMergeUpdate = (vevent: VcalVeventComponent, mergeVevent: Partial<VcalVeventComponent>) => {
    if (
        mergeVevent.summary &&
        getSupportedStringValue(vevent.summary) !== getSupportedStringValue(mergeVevent.summary)
    ) {
        return true;
    }
    if (
        mergeVevent.location &&
        getSupportedStringValue(vevent.location) !== getSupportedStringValue(mergeVevent.location)
    ) {
        return true;
    }
    if (
        mergeVevent.description &&
        getSupportedStringValue(vevent.description) !== getSupportedStringValue(mergeVevent.description)
    ) {
        return true;
    }
    if (mergeVevent.attendee) {
        const { addedAttendees, removedAttendees, hasModifiedRole } = getAttendeesDiff(vevent, mergeVevent);
        if (addedAttendees?.length || removedAttendees?.length || hasModifiedRole) {
            return true;
        }
    }
    if (mergeVevent.organizer) {
        const { addedOrganizer, removedOrganizer, hasModifiedOrganizer } = getOrganizerDiff(vevent, mergeVevent);
        if (addedOrganizer || removedOrganizer || hasModifiedOrganizer) {
            return true;
        }
    }

    if (vevent['x-pm-conference-id'] !== mergeVevent['x-pm-conference-id']) {
        return true;
    }

    if (vevent['x-pm-conference-url'] !== mergeVevent['x-pm-conference-url']) {
        return true;
    }

    if (getHasPersonalMergeUpdate(vevent, mergeVevent)) {
        return true;
    }

    return false;
};

export const getUpdateMainSeriesMergeVevent = ({
    newVeventComponent,
    oldVeventComponent,
    originalVeventComponent,
}: {
    newVeventComponent: VcalVeventComponent;
    oldVeventComponent: VcalVeventComponent;
    originalVeventComponent: VcalVeventComponent;
}) => {
    const result = getUpdateSingleEditMergeVevent(newVeventComponent, oldVeventComponent);

    // (non-breaking) changes to date-time properties need a merge with the original date-time properties
    if (result.dtstart) {
        result.dtstart = getStartDateTimeMerged(result.dtstart, originalVeventComponent.dtstart);
    }
    if (result.dtend) {
        result.dtend = getStartDateTimeMerged(result.dtend, originalVeventComponent.dtstart);
    }

    return result;
};

export const getUpdateMergeVeventWithoutMaybeNotifications = ({
    newVevent,
    oldVevent,
    mergeVevent,
}: {
    newVevent: VcalVeventComponent;
    oldVevent: VcalVeventComponent;
    mergeVevent: Partial<VcalVeventComponent>;
}) => {
    return getIsAllDay(newVevent) !== getIsAllDay(oldVevent) ? omit(mergeVevent, ['components']) : { ...mergeVevent };
};

export const handleConferenceDataInMergedVeventIfNeeded = (mergedVevent: VcalVeventComponent) => {
    // In some cases conference data is explicitly set to undefined in the mergedVevent to reflect deletion
    // We want to delete it before sending the ICS file
    if (!mergedVevent['x-pm-conference-id']) {
        delete mergedVevent['x-pm-conference-id'];
    }
    if (!mergedVevent['x-pm-conference-url']) {
        delete mergedVevent['x-pm-conference-url'];
    }
};
