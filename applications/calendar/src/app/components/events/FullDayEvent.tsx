import { CSSProperties, Ref, useMemo } from 'react';

import { Icon } from '@proton/components';
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
    const { start, data: targetEventData, isAllDay, isAllPartDay } = event;

    const model = useReadEvent(targetEventData.eventReadResult?.result, tzid);
    const { isEventReadLoading, calendarColor, eventReadError, eventTitleSafe } = getEventInformation(event, model);

    const { isUnanswered, isCancelled } = getEventStatusTraits(model);

    const eventStyle = useMemo(() => {
        return getEventStyle(calendarColor);
    }, [calendarColor]);

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
        <div className="flex flex-nowrap flex-item-fluid flex-align-items-center">
            {!isAllDay ? (
                <Icon className="mr-2 flex-item-noshrink calendar-dayeventcell-circle" size={16} name="circle-filled" />
            ) : null}

            {isOutsideStart ? <Icon name="chevron-left" size={12} className="flex-item-noshrink" /> : null}

            {eventReadError ? <Icon name="lock-filled" className="calendar-dayeventcell-lock-icon" /> : null}

            <span data-testid="calendar-view:all-day-event" className="flex-item-fluid text-ellipsis">
                {startTimeString && <span className="calendar-dayeventcell-time">{startTimeString}</span>}
                <span className="calendar-dayeventcell-title">{titleString}</span>
            </span>

            {isOutsideEnd ? <Icon name="chevron-right" size={12} className="flex-item-noshrink" /> : null}
        </div>
    );

    return (
        <div
            style={style}
            className={clsx([className, isOutsideStart && 'isOutsideStart', isOutsideEnd && 'isOutsideEnd'])}
            data-ignore-create="1"
        >
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
        </div>
    );
};

export default FullDayEvent;
