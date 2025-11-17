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
