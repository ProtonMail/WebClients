import { useGetAddressKeys } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';
import { getIsCalendarDisabled } from 'proton-shared/lib/calendar/calendar';
import { Address, Api } from 'proton-shared/lib/interfaces';
import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar/Event';
import { Calendar, CalendarBootstrap } from 'proton-shared/lib/interfaces/calendar';
import { RECURRING_TYPES } from '../../../constants';
import getMemberAndAddress from '../../../helpers/getMemberAndAddress';
import getEditEventData from '../event/getEditEventData';
import getAllEventsByUID from '../getAllEventsByUID';
import handleDeleteRecurringEvent from './handleDeleteRecurringEvent';
import handleDeleteSingleEvent from './handleDeleteSingleEvent';
import { getOriginalEvent } from './recurringHelper';
import getSingleEditRecurringData from '../event/getSingleEditRecurringData';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { EventPersonalMap } from '../../../interfaces/EventPersonalMap';
import { c } from 'ttag';

interface Arguments {
    targetEvent: any;

    addresses: Address[];
    calendars: Calendar[];

    onDeleteConfirmation: (data: any) => Promise<RECURRING_TYPES>;

    api: Api;
    call: () => Promise<void>;
    getAddressKeys: ReturnType<typeof useGetAddressKeys>;
    getCalendarKeys: ReturnType<typeof useGetAddressKeys>;
    getCalendarBootstrap: (CalendarID: string) => CalendarBootstrap;
    getDecryptedEvent: (Event: CalendarEvent) => Promise<undefined | [VcalVeventComponent, EventPersonalMap]>;
    createNotification: (data: any) => void;
}

const handleDeleteEvent = async ({
    targetEvent: {
        data: { Event: oldEvent, Calendar: oldCalendar, recurrence, readEvent }
    },

    addresses,

    onDeleteConfirmation,

    api,
    call,
    getAddressKeys,
    getCalendarKeys,
    getDecryptedEvent,
    getCalendarBootstrap,
    createNotification
}: Arguments) => {
    const calendarBootstrap = getCalendarBootstrap(oldCalendar.ID);
    if (!calendarBootstrap) {
        throw new Error('Trying to delete event without calendar information');
    }

    const oldEventData = getEditEventData({
        Event: oldEvent,
        eventResult: readEvent(oldCalendar.ID, oldEvent.ID)[0],
        memberResult: getMemberAndAddress(addresses, calendarBootstrap.Members, oldEvent.Author)
    });

    // If it's not an occurrence of a recurring event, or a single edit of a recurring event
    if (!recurrence && !oldEventData.recurrenceID) {
        return handleDeleteSingleEvent({
            oldCalendarID: oldCalendar.ID,
            oldEventID: oldEvent.ID,

            onDeleteConfirmation,
            api,
            call,
            createNotification
        });
    }

    const recurrences = await getAllEventsByUID(api, oldEventData.uid);

    const originalEvent = getOriginalEvent(recurrences);
    const originalEventResult = originalEvent ? await getDecryptedEvent(originalEvent).catch(noop) : undefined;
    if (!originalEvent || !originalEventResult?.[0]) {
        createNotification({
            text: c('Recurring update').t`Cannot delete a recurring event without the original event`,
            type: 'error'
        });
        throw new Error('Original event not found');
    }

    let originalEventData = oldEventData;

    // If this is a single edit, get the original event data
    if (originalEvent.ID !== oldEvent.ID) {
        originalEventData = getEditEventData({
            Event: originalEvent,
            eventResult: originalEventResult,
            memberResult: getMemberAndAddress(addresses, calendarBootstrap.Members, originalEvent.Author)
        });
    }

    const actualRecurrence =
        recurrence ||
        getSingleEditRecurringData(originalEventData.mainVeventComponent, oldEventData.mainVeventComponent);

    return handleDeleteRecurringEvent({
        originalEventData,
        oldEventData,

        canOnlyDeleteAll:
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
        getCalendarKeys
    });
};

export default handleDeleteEvent;
