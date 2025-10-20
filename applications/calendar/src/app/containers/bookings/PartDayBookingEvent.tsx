import { useMemo } from 'react';

import { format } from 'date-fns';

import { dateLocale } from '@proton/shared/lib/i18n';

import { type PartDayEventProps, PartDayEventView } from '../../components/events/PartDayEvent';
import type { CalendarViewEvent } from '../../containers/calendar/interface';
import { getBookingSlotStyle } from '../../helpers/color';

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
    isSelected,
    isBeforeNow,
    eventRef,
    eventPartDuration,
}: PartDayBusyEventProps) => {
    const timeString = `${format(event.start, 'HH:mm', { locale: dateLocale })} - ${format(event.end, 'HH:mm', { locale: dateLocale })}`;

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
            isSelected={isSelected}
            ref={eventRef}
            isLoaded
            title={timeString}
            eventPartDuration={eventPartDuration}
        >
            <div data-testid="calendar-day-week-view:part-day-event" className="calendar-eventcell-title">
                <div className="flex flex-nowrap items-center">
                    <span className="text-ellipsis flex-shrink color-weak" title={timeString}>{timeString}</span>
                </div>
            </div>
        </PartDayEventView>
    );
};
