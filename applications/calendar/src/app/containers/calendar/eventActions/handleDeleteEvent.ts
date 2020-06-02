import { useGetAddressKeys } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';
import { getIsCalendarDisabled } from 'proton-shared/lib/calendar/calendar';
import { Address, Api } from 'proton-shared/lib/interfaces';
import { CalendarBootstrap } from 'proton-shared/lib/interfaces/calendar';
import getMemberAndAddress from '../../../helpers/getMemberAndAddress';
import getEditEventData from '../event/getEditEventData';
import getAllEventsByUID from '../getAllEventsByUID';
import handleDeleteRecurringEvent from './handleDeleteRecurringEvent';
import handleDeleteSingleEvent from './handleDeleteSingleEvent';
import { getOriginalEvent } from './recurringHelper';
import getSingleEditRecurringData from '../event/getSingleEditRecurringData';
import { GetDecryptedEventCb } from '../eventStore/interface';
import { CalendarViewEvent, OnDeleteConfirmationCb } from '../interface';
import { getIsCalendarEvent } from '../eventStore/cache/helper';

interface Arguments {
    targetEvent: CalendarViewEvent;

    addresses: Address[];

    onDeleteConfirmation: OnDeleteConfirmationCb;

    api: Api;
    call: () => Promise<void>;
    getAddressKeys: ReturnType<typeof useGetAddressKeys>;
    getCalendarKeys: ReturnType<typeof useGetAddressKeys>;
    getCalendarBootstrap: (CalendarID: string) => CalendarBootstrap;
    getEventDecrypted: GetDecryptedEventCb;
    createNotification: (data: any) => void;
}

const handleDeleteEvent = async ({
    targetEvent: {
        data: { eventData: oldEventData, calendarData: oldCalendarData, eventRecurrence, eventReadResult },
    },

    addresses,

    onDeleteConfirmation,

    api,
    call,
    getAddressKeys,
    getCalendarKeys,
    getEventDecrypted,
    getCalendarBootstrap,
    createNotification,
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
        return handleDeleteSingleEvent({
            oldCalendarID: oldCalendarData.ID,
            oldEventID: oldEventData.ID,

            onDeleteConfirmation,
            api,
            call,
            createNotification,
        });
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

    return handleDeleteRecurringEvent({
        originalEditEventData,
        oldEditEventData,

        canOnlyDeleteAll:
            !originalEditEventData.veventComponent ||
            !oldEditEventData.veventComponent ||
            getIsCalendarDisabled(oldCalendarData) ||
            actualEventRecurrence.isSingleOccurrence,
        onDeleteConfirmation,

        recurrence: actualEventRecurrence,
        recurrences,
        api,
        call,
        createNotification,
        getAddressKeys,
        getCalendarKeys,
    });
};

export default handleDeleteEvent;
