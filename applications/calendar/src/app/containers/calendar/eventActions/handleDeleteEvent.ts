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
import { OnDeleteConfirmationCb } from '../interface';

interface Arguments {
    targetEvent: any;

    addresses: Address[];

    onDeleteConfirmation: OnDeleteConfirmationCb;

    api: Api;
    call: () => Promise<void>;
    getAddressKeys: ReturnType<typeof useGetAddressKeys>;
    getCalendarKeys: ReturnType<typeof useGetAddressKeys>;
    getCalendarBootstrap: (CalendarID: string) => CalendarBootstrap;
    getDecryptedEvent: GetDecryptedEventCb;
    createNotification: (data: any) => void;
}

const handleDeleteEvent = async ({
    targetEvent: {
        data: { Event: oldEvent, Calendar: oldCalendar, recurrence, readEvent },
    },

    addresses,

    onDeleteConfirmation,

    api,
    call,
    getAddressKeys,
    getCalendarKeys,
    getDecryptedEvent,
    getCalendarBootstrap,
    createNotification,
}: Arguments) => {
    const calendarBootstrap = getCalendarBootstrap(oldCalendar.ID);
    if (!calendarBootstrap) {
        throw new Error('Trying to delete event without calendar information');
    }

    const oldEventData = getEditEventData({
        Event: oldEvent,
        eventResult: readEvent(oldEvent.CalendarID, oldEvent.ID)?.[0],
        memberResult: getMemberAndAddress(addresses, calendarBootstrap.Members, oldEvent.Author),
    });

    // If it's not an occurrence of a recurring event, or a single edit of a recurring event
    if (!recurrence && !oldEventData.recurrenceID) {
        return handleDeleteSingleEvent({
            oldCalendarID: oldCalendar.ID,
            oldEventID: oldEvent.ID,

            onDeleteConfirmation,
            api,
            call,
            createNotification,
        });
    }

    const recurrences = await getAllEventsByUID(api, oldEventData.uid, oldEventData.calendarID);

    const originalEvent = getOriginalEvent(recurrences);
    let originalEventData = oldEventData;

    // If this is a single edit, get the original event data
    if (originalEvent && originalEvent.ID !== oldEvent.ID) {
        const originalEventResult = await getDecryptedEvent(originalEvent).catch(noop);

        originalEventData = getEditEventData({
            Event: originalEvent,
            eventResult: originalEventResult,
            memberResult: getMemberAndAddress(addresses, calendarBootstrap.Members, originalEvent.Author),
        });
    }

    const actualRecurrence =
        recurrence ||
        getSingleEditRecurringData(originalEventData.mainVeventComponent, oldEventData.mainVeventComponent);

    return handleDeleteRecurringEvent({
        originalEventData,
        oldEventData,

        canOnlyDeleteAll:
            !originalEventData.veventComponent ||
            !oldEventData.veventComponent ||
            !!getIsCalendarDisabled(oldCalendar) ||
            actualRecurrence.isSingleOccurrence,
        onDeleteConfirmation,

        recurrence: actualRecurrence,
        recurrences,
        api,
        call,
        createNotification,
        getAddressKeys,
        getCalendarKeys,
    });
};

export default handleDeleteEvent;
