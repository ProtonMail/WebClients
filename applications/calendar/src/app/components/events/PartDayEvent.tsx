import { PartDayBookingEvent } from '../../containers/bookings/timeGridView/PartDayBookingEvent';
import { TemporaryPartDayBookingEvent } from '../../containers/bookings/timeGridView/TemporaryPartDayBookingEvent';
import {
    isBookingSlotEvent,
    isTemporaryBookingSlotEvent,
} from '../../containers/bookings/utils/calendar/calendarHelper';
import { isBusySlotEvent } from '../../helpers/busySlots';
import PartDayBusyEvent from './PartDayBusyEvent';
import type { PartDayEventProps } from './PartDayEventView';
import PartDayRegularEvent from './PartDayRegularEvent';

const PartDayEvent = ({ event, ...rest }: PartDayEventProps) => {
    if (isBookingSlotEvent(event)) {
        return <PartDayBookingEvent event={event} {...rest} />;
    }

    if (isTemporaryBookingSlotEvent(event)) {
        return <TemporaryPartDayBookingEvent event={event} {...rest} />;
    }

    if (isBusySlotEvent(event)) {
        return <PartDayBusyEvent event={event} {...rest} />;
    }

    return <PartDayRegularEvent event={event} {...rest} />;
};

export default PartDayEvent;
