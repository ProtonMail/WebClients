import { CSSProperties, Ref, useMemo } from 'react';

import { CalendarEventDateHeader, Icon, useUser } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { CalendarViewEvent, CalendarViewEventTemporaryEvent } from '../../containers/calendar/interface';
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

    const model = useReadEvent(targetEventData.eventReadResult?.result, tzid);
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

    const content = (
        <div className="flex flex-nowrap flex-1 items-center">
            {!isAllDay ? (
                <Icon className="mr-2 shrink-0 calendar-dayeventcell-circle" size={4} name="circle-filled" />
            ) : null}

            {isOutsideStart ? <Icon name="chevron-left" size={3} className="shrink-0" /> : null}

            {eventReadError ? <Icon name="lock-filled" className="calendar-dayeventcell-lock-icon" /> : null}

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

            {isOutsideEnd ? <Icon name="chevron-right" size={3} className="shrink-0" /> : null}
        </div>
    );

    return (
        <li
            style={style}
            className={clsx([className, isOutsideStart && 'isOutsideStart', isOutsideEnd && 'isOutsideEnd'])}
            data-ignore-create="1"
        >
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/prefer-tag-over-role */}
            <div
                onClick={onClick}
                title={expandableTitleString}
                role="button"
                tabIndex={0}
                className={clsx([
                    'calendar-dayeventcell-inner text-left flex',
                    !isAllDay && 'isNotAllDay',
                    !isEventReadLoading && 'isLoaded',
                    !isEventReadLoading && isBeforeNow && 'isPast',
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
