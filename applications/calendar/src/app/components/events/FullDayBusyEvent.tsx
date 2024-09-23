import type { CSSProperties, Ref } from 'react';
import { useMemo } from 'react';

import { Icon, useContactEmailsCache } from '@proton/components';
import { getContactDisplayNameEmail } from '@proton/shared/lib/contacts/contactEmail';
import { canonicalizeEmail } from '@proton/shared/lib/helpers/email';
import clsx from '@proton/utils/clsx';

import type { CalendarViewBusyEvent } from '../../containers/calendar/interface';
import { getEventStyle } from '../../helpers/color';
import { useCalendarSelector } from '../../store/hooks';

interface Props {
    style: CSSProperties;
    formatTime: (date: Date) => string;
    className?: string;
    event: CalendarViewBusyEvent;
    isBeforeNow: boolean;
    isOutsideStart: boolean;
    isOutsideEnd: boolean;
    eventRef?: Ref<HTMLDivElement>;
}
const FullDayBusyEvent = ({
    style,
    formatTime,
    className = 'calendar-dayeventcell h-custom w-custom top-custom left-custom absolute text-left',
    event,
    isBeforeNow,
    isOutsideStart,
    isOutsideEnd,
    eventRef,
}: Props) => {
    const { start, isAllDay, isAllPartDay, color } = event;
    const canonicalizedEmail = canonicalizeEmail(event.email);

    const { contactEmailsMap } = useContactEmailsCache();
    const { Name: contactName } = contactEmailsMap[canonicalizedEmail] || {};
    const { nameEmail } = getContactDisplayNameEmail({ name: contactName, email: event.email });

    const isHighlighted = useCalendarSelector(
        (state) => state.calendarBusySlots.attendeeHighlight === canonicalizedEmail
    );

    const eventStyle = useMemo(() => {
        return getEventStyle(color);
    }, [color]);

    const startTimeString = useMemo(() => {
        if (start && (!isAllDay || isAllPartDay)) {
            return formatTime(start);
        }
    }, [start, isAllPartDay, isAllDay, formatTime]);

    return (
        <div
            style={style}
            className={clsx([className, isOutsideStart && 'isOutsideStart', isOutsideEnd && 'isOutsideEnd'])}
            data-ignore-create="1"
        >
            <div
                title={nameEmail}
                className={clsx([
                    'isLoaded calendar-dayeventcell-inner text-left flex',
                    !isAllDay && 'isNotAllDay',
                    isBeforeNow && 'isPast',
                ])}
                style={{
                    ...eventStyle,
                    ...(isHighlighted
                        ? {
                              boxShadow: `0 0 0 2px ${color}`,
                          }
                        : {}),
                }}
                ref={eventRef}
            >
                <div className="flex flex-nowrap flex-1 items-center">
                    {!isAllDay ? (
                        <Icon className="mr-2 shrink-0 calendar-dayeventcell-circle" size={4} name="circle-filled" />
                    ) : null}

                    {isOutsideStart ? <Icon name="chevron-left" size={3} className="shrink-0" /> : null}

                    <span data-testid="calendar-view:all-day-event" className="flex-1 text-ellipsis">
                        {startTimeString && <span className="calendar-dayeventcell-time">{startTimeString}</span>}
                        <span className="calendar-dayeventcell-title">{nameEmail}</span>
                    </span>

                    {isOutsideEnd ? <Icon name="chevron-right" size={3} className="shrink-0" /> : null}
                </div>
            </div>
        </div>
    );
};

export default FullDayBusyEvent;
