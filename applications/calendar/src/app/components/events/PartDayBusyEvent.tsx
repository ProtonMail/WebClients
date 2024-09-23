import { useMemo } from 'react';

import { useContactEmailsCache } from '@proton/components';
import { getContactDisplayNameEmail } from '@proton/shared/lib/contacts/contactEmail';
import { canonicalizeEmail } from '@proton/shared/lib/helpers/email';

import type { CalendarViewBusyEvent } from '../../containers/calendar/interface';
import { getEventStyle } from '../../helpers/color';
import { useCalendarSelector } from '../../store/hooks';
import type { PartDayEventProps } from './PartDayEvent';
import { PartDayEventView } from './PartDayEvent';

interface PartDayBusyEventProps
    extends Pick<
        PartDayEventProps,
        'size' | 'style' | 'formatTime' | 'eventPartDuration' | 'isSelected' | 'isBeforeNow' | 'eventRef'
    > {
    event: CalendarViewBusyEvent;
}

const PartDayBusyEvent = ({
    size,
    style,
    event,
    isSelected,
    isBeforeNow,
    eventRef,
    eventPartDuration,
}: PartDayBusyEventProps) => {
    const canonicalizedEmail = canonicalizeEmail(event.email);
    const isHighlighted = useCalendarSelector(
        (state) => state.calendarBusySlots.attendeeHighlight === canonicalizedEmail
    );

    const { contactEmailsMap } = useContactEmailsCache();
    const { Name: contactName } = contactEmailsMap[canonicalizedEmail] || {};

    const { nameEmail } = getContactDisplayNameEmail({ name: contactName, email: event.email });

    const { color } = event;
    const eventStyle = useMemo(() => {
        return getEventStyle(color, style);
    }, [color, style]);

    return (
        <PartDayEventView
            size={size}
            style={{
                ...eventStyle,
                ...(isHighlighted
                    ? {
                          boxShadow: `0 0 0 2px ${color}`,
                      }
                    : {}),
            }}
            isPast={isBeforeNow}
            isSelected={isSelected}
            ref={eventRef}
            isLoaded
            title={nameEmail}
            eventPartDuration={eventPartDuration}
        >
            <div data-testid="calendar-day-week-view:part-day-event" className="calendar-eventcell-title">
                <div className="flex flex-nowrap items-center">
                    <div className="text-ellipsis flex-shrink">{nameEmail}</div>
                </div>
            </div>
        </PartDayEventView>
    );
};

export default PartDayBusyEvent;
