import { useMemo } from 'react';

import { differenceInMinutes } from 'date-fns';

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

    return Array.from({ length: availableRanges }).map((_, index) => (
        <div key={index} className="w-full py-px" style={{ height }}>
            <div className="h-full rounded-sm" style={{ backgroundColor, opacity: 0.2 }} />
        </div>
    ));
};

export const PartDayBookingEvent = ({
    size,
    style,
    event,
    isBeforeNow,
    eventRef,
    eventPartDuration,
}: PartDayBusyEventProps) => {
    const eventStyle = useMemo(() => {
        return getBookingSlotStyle(event.data.calendarData.Color, style);
    }, [event.data.calendarData.Color, style]);

    return (
        <PartDayEventView
            size={size}
            style={{
                ...eventStyle,
            }}
            isPast={isBeforeNow}
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
