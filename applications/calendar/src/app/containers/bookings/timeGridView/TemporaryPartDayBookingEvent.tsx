import { useMemo } from 'react';

import { type PartDayEventProps, PartDayEventView } from '../../../components/events/PartDayEvent';
import { getBookingSlotStyle } from '../../../helpers/color';
import type { CalendarViewEvent } from '../../calendar/interface';

interface PartDayBusyEventProps
    extends Pick<
        PartDayEventProps,
        'size' | 'style' | 'formatTime' | 'eventPartDuration' | 'isSelected' | 'isBeforeNow' | 'eventRef'
    > {
    event: CalendarViewEvent;
}

export const TemporaryPartDayBookingEvent = ({
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
            <div data-testid="calendar-day-week-view:part-day-event"></div>
        </PartDayEventView>
    );
};
