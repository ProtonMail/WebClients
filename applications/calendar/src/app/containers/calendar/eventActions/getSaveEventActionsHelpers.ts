import { ICAL_METHOD } from '@proton/shared/lib/calendar/constants';
import { getBase64SharedSessionKey } from '@proton/shared/lib/calendar/crypto/keys/helpers';
import { getInviteVeventWithUpdatedParstats } from '@proton/shared/lib/calendar/mailIntegration/invite';
import { omit } from '@proton/shared/lib/helpers/object';
import { SyncMultipleApiResponse, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
import { GetCalendarKeys } from '@proton/shared/lib/interfaces/hooks/GetCalendarKeys';

import { INVITE_ACTION_TYPES, InviteActions, OnSendPrefsErrors } from '../../../interfaces/Invite';
import { SyncEventActionOperations, getCreateSyncOperation } from '../getSyncMultipleEventsPayload';
import { getCorrectedSaveInviteActions } from './inviteActions';

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
    if (isCreatingSingleEdit && correctedSaveInviteActions.type === INVITE_ACTION_TYPES.SEND_UPDATE) {
        // We are creating a single edit, which is like creating a new event, not updating an existing one
        correctedSaveInviteActions.type = INVITE_ACTION_TYPES.SEND_INVITATION;
    }
    await onEquivalentAttendees(newVevent, correctedSaveInviteActions);
    const isSendInviteType = [INVITE_ACTION_TYPES.SEND_INVITATION, INVITE_ACTION_TYPES.SEND_UPDATE].includes(
        correctedSaveInviteActions.type
    );

    const method = isSendInviteType ? ICAL_METHOD.REQUEST : undefined;
    const correctedVevent = getInviteVeventWithUpdatedParstats(newVevent, oldVevent, method);

    return { vevent: correctedVevent, inviteActions: correctedSaveInviteActions, isSendInviteType };
};
