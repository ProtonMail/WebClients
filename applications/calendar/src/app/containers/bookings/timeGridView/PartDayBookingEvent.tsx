import { useMemo } from 'react';

import { type PartDayEventProps, PartDayEventView } from '../../../components/events/PartDayEvent';
import { getBookingSlotStyle } from '../../../helpers/color';
import type { CalendarViewEvent } from '../../calendar/interface';
import { useBookings } from '../bookingsProvider/BookingsProvider';

import './PartDayBookingEvent.scss';

interface PartDayBusyEventProps
    extends Pick<
        PartDayEventProps,
        'size' | 'style' | 'formatTime' | 'eventPartDuration' | 'isSelected' | 'isBeforeNow' | 'eventRef'
    > {
    event: CalendarViewEvent;
}

export const PartDayBookingEvent = ({
    size,
    style,
    event,
    isBeforeNow,
    eventRef,
    eventPartDuration,
}: PartDayBusyEventProps) => {
    const { formData } = useBookings();

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
            <div
                data-testid="calendar-day-week-view:part-day-event"
                className={`booking-cell h-full w-full rounded-sm booking-cell--duration-${formData.duration}`}
                style={{
                    '--booking-duration-color': eventStyle['--booking-cell-background'] || '',
                }}
            ></div>
        </PartDayEventView>
    );
};
