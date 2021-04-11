import { getIsCalendarDisabled } from 'proton-shared/lib/calendar/calendar';
import getMemberAndAddress from 'proton-shared/lib/calendar/integration/getMemberAndAddress';
import { getSelfAttendeeToken } from 'proton-shared/lib/calendar/integration/invite';
import { noop } from 'proton-shared/lib/helpers/function';
import { Address, Api } from 'proton-shared/lib/interfaces';
import { CalendarBootstrap, CalendarEvent, VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar';
import { DELETE_CONFIRMATION_TYPES } from 'proton-shared/lib/calendar/constants';

import { getEventDeletedText, getRecurringEventDeletedText } from '../../../components/eventModal/eventForm/i18n';
import { EventOldData } from '../../../interfaces/EventData';
import {
    INVITE_ACTION_TYPES,
    InviteActions,
    SendIcsActionData,
    UpdatePartstatOperation,
    UpdatePersonalPartOperation,
} from '../../../interfaces/Invite';
import getEditEventData from '../event/getEditEventData';
import getSingleEditRecurringData from '../event/getSingleEditRecurringData';
import { getIsCalendarEvent } from '../eventStore/cache/helper';
import { GetDecryptedEventCb } from '../eventStore/interface';
import getAllEventsByUID from '../getAllEventsByUID';
import { getDeleteSyncOperation, SyncEventActionOperations } from '../getSyncMultipleEventsPayload';
import { CalendarViewEvent, OnDeleteConfirmationCb } from '../interface';
import { getDeleteRecurringEventActions } from './getDeleteRecurringEventActions';
import getRecurringDeleteType from './getRecurringDeleteType';
import { getUpdatedDeleteInviteActions } from './inviteActions';
import { getOriginalEvent } from './recurringHelper';

const { DECLINE_INVITATION, DECLINE_DISABLED, CANCEL_INVITATION, CANCEL_DISABLED } = INVITE_ACTION_TYPES;

const getDeleteSingleEventActionsHelper = async ({
    oldEventData,
    oldEditEventData,
    onDeleteConfirmation,
    inviteActions,
    isInvitation,
    sendIcs,
}: {
    oldEventData: CalendarEvent;
    oldEditEventData: EventOldData;
    onDeleteConfirmation: OnDeleteConfirmationCb;
    inviteActions: InviteActions;
    isInvitation: boolean;
    sendIcs: (
        data: SendIcsActionData
    ) => Promise<{ veventComponent?: VcalVeventComponent; inviteActions: InviteActions }>;
}) => {
    let updatedInviteActions = getUpdatedDeleteInviteActions({
        inviteActions,
        oldVevent: oldEditEventData.veventComponent,
    });
    const { type: inviteType, sendCancellationNotice } = updatedInviteActions;
    await onDeleteConfirmation({
        type: DELETE_CONFIRMATION_TYPES.SINGLE,
        inviteActions: updatedInviteActions,
        isInvitation,
    });
    if (inviteType === CANCEL_INVITATION) {
        const { inviteActions: cleanInviteActions } = await sendIcs({
            inviteActions: updatedInviteActions,
            cancelVevent: oldEditEventData.veventComponent,
        });
        updatedInviteActions = cleanInviteActions;
    } else if (inviteType === DECLINE_INVITATION && sendCancellationNotice) {
        const { inviteActions: cleanInviteActions } = await sendIcs({
            inviteActions: updatedInviteActions,
            vevent: oldEditEventData.veventComponent,
        });
        updatedInviteActions = cleanInviteActions;
    }
    const deleteOperation = getDeleteSyncOperation(oldEventData);
    const multiActions: SyncEventActionOperations[] = [
        {
            calendarID: oldEditEventData.calendarID,
            memberID: oldEditEventData.memberID,
            addressID: oldEditEventData.addressID,
            operations: [deleteOperation],
        },
    ];
    const successText = getEventDeletedText(updatedInviteActions);
    return {
        syncActions: multiActions,
        texts: { success: successText },
    };
};

interface Arguments {
    targetEvent: CalendarViewEvent;
    addresses: Address[];
    onDeleteConfirmation: OnDeleteConfirmationCb;
    api: Api;
    getCalendarBootstrap: (CalendarID: string) => CalendarBootstrap;
    getEventDecrypted: GetDecryptedEventCb;
    inviteActions: InviteActions;
    sendIcs: (
        data: SendIcsActionData
    ) => Promise<{ veventComponent?: VcalVeventComponent; inviteActions: InviteActions }>;
}

const getDeleteEventActions = async ({
    targetEvent: {
        data: { eventData: oldEventData, calendarData: oldCalendarData, eventRecurrence, eventReadResult },
    },
    addresses,
    onDeleteConfirmation,
    api,
    getEventDecrypted,
    getCalendarBootstrap,
    inviteActions,
    sendIcs,
}: Arguments): Promise<{
    syncActions: SyncEventActionOperations[];
    updatePartstatActions?: UpdatePartstatOperation[];
    updatePersonalPartActions?: UpdatePersonalPartOperation[];
    texts: { success: string };
}> => {
    const calendarBootstrap = getCalendarBootstrap(oldCalendarData.ID);
    if (!calendarBootstrap) {
        throw new Error('Trying to delete event without calendar information');
    }
    if (!oldEventData || !getIsCalendarEvent(oldEventData)) {
        throw new Error('Trying to delete event without event information');
    }

    const oldEditEventData = getEditEventData({
        eventData: oldEventData,
        eventResult: eventReadResult?.result,
        memberResult: getMemberAndAddress(addresses, calendarBootstrap.Members, oldEventData.Author),
    });

    const isInvitation = !oldEditEventData.eventData.IsOrganizer;
    const isSingleEdit = !!oldEditEventData.recurrenceID;
    // If it's not an occurrence of a recurring event, or a single edit of a recurring event
    if (!eventRecurrence && !isSingleEdit) {
        return getDeleteSingleEventActionsHelper({
            oldEventData,
            oldEditEventData,
            onDeleteConfirmation,
            inviteActions,
            isInvitation,
            sendIcs,
        });
    }

    const recurrences = await getAllEventsByUID(api, oldEditEventData.uid, oldEditEventData.calendarID);
    const originalEventData = getOriginalEvent(recurrences);
    const isOrphanSingleEdit = isSingleEdit && !originalEventData;
    // If it's an orphan single edit, treat as a single event
    if (isOrphanSingleEdit) {
        return getDeleteSingleEventActionsHelper({
            oldEventData,
            oldEditEventData,
            onDeleteConfirmation,
            inviteActions,
            isInvitation,
            sendIcs,
        });
    }

    let originalEditEventData = oldEditEventData;

    // If this is a single edit, get the original event data
    if (originalEventData && originalEventData.ID !== oldEventData.ID) {
        const originalEventResult = await getEventDecrypted(originalEventData).catch(noop);

        originalEditEventData = getEditEventData({
            eventData: originalEventData,
            eventResult: originalEventResult,
            memberResult: getMemberAndAddress(addresses, calendarBootstrap.Members, originalEventData.Author),
        });
    }

    const actualEventRecurrence =
        eventRecurrence ||
        getSingleEditRecurringData(originalEditEventData.mainVeventComponent, oldEditEventData.mainVeventComponent);
    const updatedDeleteInviteActions = getUpdatedDeleteInviteActions({
        inviteActions,
        oldVevent: originalEditEventData.veventComponent,
    });
    const isDeleteInvitation = [DECLINE_INVITATION, DECLINE_DISABLED].includes(updatedDeleteInviteActions.type);
    const isCancelInvitation = [CANCEL_INVITATION, CANCEL_DISABLED].includes(updatedDeleteInviteActions.type);
    const selfAttendeeToken = getSelfAttendeeToken(originalEditEventData.veventComponent, addresses);

    const { type: deleteType, inviteActions: updatedInviteActions } = await getRecurringDeleteType({
        originalEditEventData,
        canOnlyDeleteAll:
            !originalEditEventData.veventComponent ||
            !oldEditEventData.veventComponent ||
            getIsCalendarDisabled(oldCalendarData) ||
            actualEventRecurrence.isSingleOccurrence ||
            isCancelInvitation ||
            (isDeleteInvitation && !isSingleEdit),
        canOnlyDeleteThis: isDeleteInvitation && isSingleEdit,
        onDeleteConfirmation,
        recurrences,
        recurrence: actualEventRecurrence,
        inviteActions: updatedDeleteInviteActions,
        isInvitation,
        selfAttendeeToken,
    });
    const {
        multiSyncActions,
        inviteActions: deleteInviteActions,
        updatePartstatActions,
        updatePersonalPartActions,
    } = await getDeleteRecurringEventActions({
        type: deleteType,
        recurrence: actualEventRecurrence,
        recurrences,
        originalEditEventData,
        oldEditEventData,
        isInvitation,
        inviteActions: updatedInviteActions,
        selfAttendeeToken,
        sendIcs,
    });
    const successText = getRecurringEventDeletedText(deleteType, deleteInviteActions);
    return {
        syncActions: multiSyncActions,
        updatePartstatActions,
        updatePersonalPartActions,
        texts: {
            success: successText,
        },
    };
};

export default getDeleteEventActions;
