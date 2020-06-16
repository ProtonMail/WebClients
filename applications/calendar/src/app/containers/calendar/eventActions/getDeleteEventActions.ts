import { noop } from 'proton-shared/lib/helpers/function';
import { getIsCalendarDisabled } from 'proton-shared/lib/calendar/calendar';
import { Address, Api } from 'proton-shared/lib/interfaces';
import { CalendarBootstrap } from 'proton-shared/lib/interfaces/calendar';
import getMemberAndAddress from '../../../helpers/getMemberAndAddress';
import getEditEventData from '../event/getEditEventData';
import getAllEventsByUID from '../getAllEventsByUID';
import { getOriginalEvent } from './recurringHelper';
import getSingleEditRecurringData from '../event/getSingleEditRecurringData';
import { GetDecryptedEventCb } from '../eventStore/interface';
import { CalendarViewEvent, OnDeleteConfirmationCb } from '../interface';
import { getIsCalendarEvent } from '../eventStore/cache/helper';
import { getEventDeletedText, getRecurringEventDeletedText } from '../../../components/eventModal/eventForm/i18n';
import { getDeleteSyncOperation, SyncEventActionOperations } from '../getSyncMultipleEventsPayload';
import { getDeleteRecurringEventActions } from './getDeleteRecurringEventActions';
import getRecurringDeleteType from './getRecurringDeleteType';

interface Arguments {
    targetEvent: CalendarViewEvent;
    addresses: Address[];
    onDeleteConfirmation: OnDeleteConfirmationCb;
    api: Api;
    getCalendarBootstrap: (CalendarID: string) => CalendarBootstrap;
    getEventDecrypted: GetDecryptedEventCb;
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
}: Arguments) => {
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

    // If it's not an occurrence of a recurring event, or a single edit of a recurring event
    if (!eventRecurrence && !oldEditEventData.recurrenceID) {
        const deleteOperation = getDeleteSyncOperation(oldEventData);
        const multiActions: SyncEventActionOperations[] = [
            {
                calendarID: oldEditEventData.calendarID,
                memberID: oldEditEventData.memberID,
                addressID: oldEditEventData.addressID,
                operations: [deleteOperation],
            },
        ];
        const successText = getEventDeletedText();
        return {
            actions: multiActions,
            texts: {
                success: successText,
            },
        };
    }

    const recurrences = await getAllEventsByUID(api, oldEditEventData.uid, oldEditEventData.calendarID);

    const originalEventData = getOriginalEvent(recurrences);
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

    const deleteType = await getRecurringDeleteType({
        originalEditEventData,
        canOnlyDeleteAll:
            !originalEditEventData.veventComponent ||
            !oldEditEventData.veventComponent ||
            getIsCalendarDisabled(oldCalendarData) ||
            actualEventRecurrence.isSingleOccurrence,
        onDeleteConfirmation,
        recurrence: actualEventRecurrence,
    });
    const multiActions = getDeleteRecurringEventActions({
        type: deleteType,
        recurrence: actualEventRecurrence,
        recurrences,
        originalEditEventData,
        oldEditEventData,
    });
    const successText = getRecurringEventDeletedText(deleteType);
    return {
        actions: [multiActions],
        texts: {
            success: successText,
        },
    };
};

export default getDeleteEventActions;
