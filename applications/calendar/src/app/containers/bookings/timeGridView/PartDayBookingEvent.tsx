import { useCallback, useMemo } from 'react';

import { addMinutes, differenceInMinutes, isBefore } from 'date-fns';

import { type PartDayEventProps, PartDayEventView } from '../../../components/events/PartDayEvent';
import { getBookingSlotStyle } from '../../../helpers/color';
import type { CalendarViewEvent } from '../../calendar/interface';
import { useBookings } from '../bookingsProvider/BookingsProvider';

interface PartDayBusyEventProps
    extends Pick<
        PartDayEventProps,
        'size' | 'style' | 'formatTime' | 'eventPartDuration' | 'isSelected' | 'isBeforeNow' | 'eventRef'
    > {
    event: CalendarViewEvent;
}

interface BookingSlotsProps {
    start: Date;
    end: Date;
    backgroundColor: string;
}

const computeHeight = (duration: number, totalMinutes: number) => {
    const height = duration / totalMinutes;
    return `${height * 100}%`;
};

const BookingSlots = ({ start, end, backgroundColor }: BookingSlotsProps) => {
    const { formData } = useBookings();

    const totalMinutes = differenceInMinutes(end, start);
    const height = computeHeight(formData.duration, totalMinutes);
    const availableRanges = Math.floor(totalMinutes / formData.duration);

    const getItemOpacity = useCallback(
        (index: number) => {
            const now = new Date();
            const itemStart = addMinutes(start, index * formData.duration);
            return isBefore(itemStart, now) ? 0.1 : 0.2;
        },
        [start, formData.duration]
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
    const eventStyle = useMemo(() => {
        return getBookingSlotStyle(event.data.calendarData.Color, style);
    }, [event.data.calendarData.Color, style]);

    return (
        <PartDayEventView
            size={size}
            style={{
                ...eventStyle,
            }}
            isSelected={false}
            ref={eventRef}
            isLoaded
            eventPartDuration={eventPartDuration}
        >
            <div data-testid="calendar-day-week-view:part-day-event" className="booking-cell h-full w-full">
                <BookingSlots start={event.start} end={event.end} backgroundColor={event.data.calendarData.Color} />
            </div>
        </PartDayEventView>
    );
};
