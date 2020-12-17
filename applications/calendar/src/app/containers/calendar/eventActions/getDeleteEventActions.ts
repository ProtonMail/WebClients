import { getSelfAttendeeToken } from 'proton-shared/lib/calendar/integration/invite';
import { noop } from 'proton-shared/lib/helpers/function';
import { getIsCalendarDisabled } from 'proton-shared/lib/calendar/calendar';
import { Address, Api } from 'proton-shared/lib/interfaces';
import { CalendarBootstrap, CalendarEvent } from 'proton-shared/lib/interfaces/calendar';
import getMemberAndAddress from 'proton-shared/lib/calendar/integration/getMemberAndAddress';
import { getIsEventCancelled } from '../../../helpers/event';
import { EventOldData } from '../../../interfaces/EventData';
import getEditEventData from '../event/getEditEventData';
import getAllEventsByUID from '../getAllEventsByUID';
import { UpdatePartstatOperation } from '../getUpdatePartstatOperation';
import { INVITE_ACTION_TYPES, InviteActions, NO_INVITE_ACTION } from './inviteActions';
import { getOriginalEvent } from './recurringHelper';
import getSingleEditRecurringData from '../event/getSingleEditRecurringData';
import { GetDecryptedEventCb } from '../eventStore/interface';
import { CalendarViewEvent, OnDeleteConfirmationCb } from '../interface';
import { getIsCalendarEvent } from '../eventStore/cache/helper';
import { getEventDeletedText, getRecurringEventDeletedText } from '../../../components/eventModal/eventForm/i18n';
import { getDeleteSyncOperation, SyncEventActionOperations } from '../getSyncMultipleEventsPayload';
import { getDeleteRecurringEventActions } from './getDeleteRecurringEventActions';
import getRecurringDeleteType from './getRecurringDeleteType';
import { DELETE_CONFIRMATION_TYPES } from '../../../constants';

const getDeleteSingleEventActionsHelper = async ({
    oldEventData,
    oldEditEventData,
    onDeleteConfirmation,
    inviteActions = NO_INVITE_ACTION,
    isInvitation,
}: {
    oldEventData: CalendarEvent;
    oldEditEventData: EventOldData;
    onDeleteConfirmation: OnDeleteConfirmationCb;
    inviteActions: InviteActions;
    isInvitation: boolean;
}) => {
    await onDeleteConfirmation({
        type: DELETE_CONFIRMATION_TYPES.SINGLE,
        veventComponent: oldEditEventData.veventComponent,
        inviteActions,
        isInvitation,
    });
    const deleteOperation = getDeleteSyncOperation(oldEventData);
    const multiActions: SyncEventActionOperations[] = [
        {
            calendarID: oldEditEventData.calendarID,
            memberID: oldEditEventData.memberID,
            addressID: oldEditEventData.addressID,
            operations: [deleteOperation],
        },
    ];
    const successText = getEventDeletedText(inviteActions);
    return {
        syncActions: {
            actions: multiActions,
            texts: {
                success: successText,
            },
        },
    };
};

interface Arguments {
    targetEvent: CalendarViewEvent;
    addresses: Address[];
    onDeleteConfirmation: OnDeleteConfirmationCb;
    api: Api;
    getCalendarBootstrap: (CalendarID: string) => CalendarBootstrap;
    getEventDecrypted: GetDecryptedEventCb;
    inviteActions?: InviteActions;
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
    inviteActions = NO_INVITE_ACTION,
}: Arguments): Promise<{
    syncActions: {
        actions: SyncEventActionOperations[];
        texts: {
            success: string;
        };
    };
    updatePartstatActions?: UpdatePartstatOperation[];
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
    const isDeleteInvitation = inviteActions.type === INVITE_ACTION_TYPES.DECLINE;
    const recurrencesWithoutSelf = recurrences.filter((event) => {
        return event.ID !== oldEditEventData.eventData.ID;
    });
    const hasSingleModifications = !!recurrencesWithoutSelf.length;
    const hasOnlyCancelledSingleModifications = !recurrencesWithoutSelf.some((event) => !getIsEventCancelled(event));
    const declineVevent = isSingleEdit ? oldEditEventData.veventComponent : originalEditEventData.veventComponent;
    const selfAttendeeToken = getSelfAttendeeToken(declineVevent, addresses);

    const { type: deleteType, inviteActions: updatedInviteActions } = await getRecurringDeleteType({
        originalEditEventData,
        canOnlyDeleteAll:
            !originalEditEventData.veventComponent ||
            !oldEditEventData.veventComponent ||
            getIsCalendarDisabled(oldCalendarData) ||
            actualEventRecurrence.isSingleOccurrence ||
            (isDeleteInvitation && !isSingleEdit),
        canOnlyDeleteThis: isDeleteInvitation && isSingleEdit,
        onDeleteConfirmation,
        recurrences,
        recurrence: actualEventRecurrence,
        hasSingleModifications,
        hasOnlyCancelledSingleModifications,
        inviteActions,
        isInvitation,
        veventComponent: declineVevent,
        selfAttendeeToken,
    });
    const { multiSyncActions, updatePartstatActions } = getDeleteRecurringEventActions({
        type: deleteType,
        recurrence: actualEventRecurrence,
        recurrences,
        originalEditEventData,
        oldEditEventData,
        isInvitation,
        inviteActions: updatedInviteActions,
        selfAttendeeToken,
    });
    const successText = getRecurringEventDeletedText(deleteType, updatedInviteActions);
    return {
        syncActions: {
            actions: multiSyncActions,
            texts: {
                success: successText,
            },
        },
        updatePartstatActions,
    };
};

export default getDeleteEventActions;
