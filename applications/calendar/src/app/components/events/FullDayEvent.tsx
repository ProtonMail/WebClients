import type { CSSProperties, KeyboardEvent, Ref } from 'react';
import { useMemo } from 'react';

import { useUser } from '@proton/account/user/hooks';
import CalendarEventDateHeader from '@proton/components/components/calendarEventDateHeader/CalendarEventDateHeader';
import { IcChevronLeft } from '@proton/icons/icons/IcChevronLeft';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { IcCircleFilled } from '@proton/icons/icons/IcCircleFilled';
import { IcLockFilled } from '@proton/icons/icons/IcLockFilled';
import clsx from '@proton/utils/clsx';

import type { CalendarViewEvent, CalendarViewEventTemporaryEvent } from '../../containers/calendar/interface';
import { getEventStyle } from '../../helpers/color';
import { getEventStatusTraits } from '../../helpers/event';
import { getEventErrorMessage, getEventLoadingMessage } from './error';
import getEventInformation from './getEventInformation';
import useReadEvent from './useReadEvent';

interface Props {
    style: CSSProperties;
    formatTime: (date: Date) => string;
    className?: string;
    event: CalendarViewEvent | CalendarViewEventTemporaryEvent;
    isSelected: boolean;
    isBeforeNow: boolean;
    isOutsideStart: boolean;
    isOutsideEnd: boolean;
    onClick?: () => void;
    eventRef?: Ref<HTMLDivElement>;
    tzid: string;
}
const FullDayEvent = ({
    style,
    formatTime,
    className = 'calendar-dayeventcell h-custom w-custom top-custom left-custom absolute text-left',
    event,
    isSelected,
    isBeforeNow,
    isOutsideStart,
    isOutsideEnd,
    eventRef,
    onClick,
    tzid,
}: Props) => {
    const [{ hasPaidMail }] = useUser();
    const { start, end, data: targetEventData, isAllDay, isAllPartDay } = event;

    const model = useReadEvent(targetEventData, tzid);
    const { isEventReadLoading, color, eventReadError, eventTitleSafe } = getEventInformation(
        event,
        model,
        hasPaidMail
    );

    const { isUnanswered, isCancelled } = getEventStatusTraits(model);

    const eventStyle = useMemo(() => {
        return getEventStyle(color);
    }, [color]);

    const startTimeString = useMemo(() => {
        if (start && (!isAllDay || isAllPartDay)) {
            return formatTime(start);
        }
    }, [start, isAllPartDay, isAllDay, formatTime]);

    const titleString = (() => {
        if (eventReadError) {
            return '';
        }
        if (isEventReadLoading) {
            return '…';
        }
        return eventTitleSafe;
    })();

    const expandableTitleString = (() => {
        if (eventReadError) {
            return getEventErrorMessage(eventReadError);
        }
        if (isEventReadLoading) {
            return getEventLoadingMessage();
        }
        return eventTitleSafe;
    })();

    const handleKeyDown = (e: KeyboardEvent) => {
        // The shortest way we found to open the event popover using keyboard
        // is to click on the event.
        // We need to trigger a mousedown to launch the logic to open an event,
        // but since mousedown event is allowing to drag the event on the grid,
        // we need to trigger a mouseup event right after so that we only open the popover.
        if (e.key === 'Enter' || e.key === ' ') {
            onClick?.();
        }
    };

    const content = (
        <div className="flex flex-nowrap flex-1 items-center">
            {!isAllDay ? <IcCircleFilled className="mr-2 shrink-0 calendar-dayeventcell-circle" size={4} /> : null}

            {isOutsideStart ? <IcChevronLeft size={3} className="shrink-0" /> : null}

            {eventReadError ? <IcLockFilled className="calendar-dayeventcell-lock-icon" /> : null}

            <span data-testid="calendar-view:all-day-event" className="flex-1 text-ellipsis">
                {startTimeString && <span className="calendar-dayeventcell-time">{startTimeString}</span>}
                <span className="calendar-dayeventcell-title">{titleString}</span>
                <div className="sr-only">
                    <CalendarEventDateHeader
                        startDate={start}
                        endDate={end}
                        isAllDay={true}
                        formatTime={formatTime}
                        hasFakeUtcDates
                        hasModifiedAllDayEndDate
                    />
                </div>
            </span>

            {isOutsideEnd ? <IcChevronRight size={3} className="shrink-0" /> : null}
        </div>
    );

    return (
        <li
            style={style}
            className={clsx([className, isOutsideStart && 'isOutsideStart', isOutsideEnd && 'isOutsideEnd'])}
            data-ignore-create="1"
        >
            {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
            <div
                onClick={onClick}
                onKeyDown={handleKeyDown}
                title={expandableTitleString}
                role="button"
                tabIndex={0}
                className={clsx([
                    'calendar-dayeventcell-inner text-left flex',
                    !isAllDay && 'isNotAllDay',
                    !isEventReadLoading && 'isLoaded',
                    isBeforeNow && 'isPast',
                    isSelected && 'isSelected',
                    isUnanswered && 'isUnanswered',
                    isCancelled && 'isCancelled',
                ])}
                style={eventStyle}
                ref={eventRef}
            >
                {content}
            </div>
        </li>
    );
};

export default FullDayEvent;
