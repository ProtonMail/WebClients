import { useCallback, useMemo } from 'react';

import { addMinutes, isBefore } from 'date-fns';

import { fromUTCDateToLocalFakeUTCDate } from '@proton/shared/lib/date/timezone';

import { getEventPartDuration } from '../../../components/calendar/TimeGrid/dayEventsHelpers';
import { type PartDayEventProps, PartDayEventView } from '../../../components/events/PartDayEvent';
import { getBookingSlotStyle } from '../../../helpers/color';
import type { CalendarViewEvent } from '../../calendar/interface';
import { useBookings } from '../bookingsProvider/BookingsProvider';

import './PartDayBookingEvent.scss';

interface PartDayBusyEventProps extends Pick<
    PartDayEventProps,
    'size' | 'style' | 'formatTime' | 'eventPartDuration' | 'isSelected' | 'isBeforeNow' | 'eventRef'
> {
    event: CalendarViewEvent;
}

interface BookingSlotsProps {
    start: Date;
    eventPartDuration: number;
    slotPartDuration: number;
    backgroundColor: string;
}

const computeHeight = (slotDuration: number, partEventDuration: number) => {
    const height = slotDuration / partEventDuration;
    return `${height * 100}%`;
};

/**
 * We use eventPartDuration and slotPartDuration to compute the height and number of booking slots.
 * This is because, we can have ranges spreading across multiple days when user change timezone.
 */
const BookingSlots = ({ start, eventPartDuration, slotPartDuration, backgroundColor }: BookingSlotsProps) => {
    const { formData } = useBookings();

    const height = computeHeight(slotPartDuration, eventPartDuration);
    const availableRanges = Math.floor(eventPartDuration / slotPartDuration);

    const getItemOpacity = useCallback(
        (index: number) => {
            const now = new Date();
            const nowWithTz = fromUTCDateToLocalFakeUTCDate(now, false, formData.timezone);
            const itemStart = addMinutes(start, index * formData.duration);
            return isBefore(itemStart, nowWithTz) ? 0.1 : 0.2;
        },
        [start, formData.duration, formData.timezone]
    );

    return Array.from({ length: availableRanges }).map((_, index) => (
        <div key={index} className="w-full py-px" style={{ height }}>
            <div
                className="h-full rounded-sm"
                style={{
                    backgroundColor,
                    opacity: getItemOpacity(index),
                }}
            />
        </div>
    ));
};

export const PartDayBookingEvent = ({ size, style, event, eventRef, eventPartDuration }: PartDayBusyEventProps) => {
    const { formData } = useBookings();

    const eventStyle = useMemo(() => {
        return getBookingSlotStyle(event.data.calendarData.Color, style);
    }, [event.data.calendarData.Color, style]);

    const slotPartDuration = getEventPartDuration({
        start: new Date(),
        end: addMinutes(new Date(), formData.duration),
        colEnd: 0,
    });

    return (
        <PartDayEventView
            size={size}
            style={eventStyle}
            isSelected={false}
            ref={eventRef}
            isLoaded
            hideOverflow={false}
            eventPartDuration={eventPartDuration}
            className="group-hover-opacity-container"
        >
            <span
                className="group-hover:opacity-100 group-hover:opacity-100-no-width booking-drag-handle absolute top-custom left-custom border bg-norm rounded-full border-2"
                style={{ borderColor: 'var(--color-alt)', '--left-custom': '6px', '--top-custom': '-6px' }}
            />
            <div data-testid="calendar-day-week-view:part-day-event" className="booking-cell h-full w-full ">
                <BookingSlots
                    start={event.start}
                    eventPartDuration={eventPartDuration}
                    slotPartDuration={slotPartDuration}
                    backgroundColor={event.data.calendarData.Color}
                />
            </div>
            <span
                className="group-hover:opacity-100 group-hover:opacity-100-no-width booking-drag-handle absolute bottom-custom right-custom border bg-norm rounded-full border-2"
                style={{ borderColor: 'var(--color-alt)', '--right-custom': '6px', '--bottom-custom': '-6px' }}
            />
        </PartDayEventView>
    );
};
