import type { CalendarWithOwnMembers } from '@proton/shared/lib/interfaces/calendar';

import type { CalendarViewBusyEvent, CalendarViewEvent } from '../../../calendar/interface';
import { BOOKING_SLOT_ID, TEMPORARY_BOOKING_SLOT } from '../../bookingsProvider/interface';

export const isBookingSlotEvent = (event: CalendarViewEvent | CalendarViewBusyEvent): event is CalendarViewEvent => {
    return event.uniqueId.startsWith(BOOKING_SLOT_ID);
};

export const isTemporaryBookingSlotEvent = (
    event: CalendarViewEvent | CalendarViewBusyEvent
): event is CalendarViewEvent => {
    return event.uniqueId.startsWith(TEMPORARY_BOOKING_SLOT);
};

export const getCalendarAndOwner = (selectedCalendarId: string, calendars?: CalendarWithOwnMembers[]) => {
    const calendar = calendars?.find((calendar) => calendar.ID === selectedCalendarId);
    if (!calendar) {
        return;
    }

    const calendarOwner = calendar.Owner.Email;
    const ownerAddress = calendar.Members.find((member) => member.Email === calendarOwner);
    if (!ownerAddress) {
        return;
    }

    return {
        calendar,
        calendarOwner,
        ownerAddress,
    };
};
