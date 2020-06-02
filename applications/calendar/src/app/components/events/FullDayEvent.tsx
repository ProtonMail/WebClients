import React, { CSSProperties, Ref, useMemo } from 'react';
import { Icon, classnames } from 'react-components';

import useReadEvent from './useReadEvent';
import { getConstrastingColor } from '../../helpers/color';
import { getEventErrorMessage, getEventLoadingMessage } from './error';
import { CalendarViewEvent, CalendarViewEventTemporaryEvent } from '../../containers/calendar/interface';
import getEventInformation from './getEventInformation';

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
    className = 'calendar-dayeventcell absolute alignleft',
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

    const eventStyle = useMemo(() => {
        const background = calendarColor;
        return {
            '--background': background,
            '--foreground': getConstrastingColor(background),
        };
    }, [calendarColor, isAllDay, isSelected]);

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
        if (startTimeString) {
            return `${startTimeString} ${eventTitleSafe}`;
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
        <div className="flex flex-nowrap flex-item-fluid flex-items-center">
            {!isAllDay ? (
                <Icon className="mr0-25 flex-item-noshrink calendar-dayeventcell-circle" size={12} name="circle" />
            ) : null}

            {isOutsideStart ? <Icon name="caret" size={12} className="flex-item-noshrink rotateZ-90" /> : null}

            {eventReadError ? <Icon name="lock" className="calendar-dayeventcell-lock-icon" /> : null}

            <span data-test-id="calendar-view:all-day-event" className="flex-item-fluid ellipsis">
                {titleString}
            </span>

            {isOutsideEnd ? <Icon name="caret" size={12} className="flex-item-noshrink rotateZ-270" /> : null}
        </div>
    );

    return (
        <div
            style={style}
            className={classnames([
                className,
                isBeforeNow && 'calendar-dayeventcell--isBefore',
                isOutsideStart && 'calendar-dayeventcell--isOutsideStart',
                isOutsideEnd && 'calendar-dayeventcell--isOutsideEnd',
            ])}
            data-ignore-create="1"
        >
            <div
                onClick={onClick}
                title={expandableTitleString}
                role="button"
                tabIndex={0}
                className={classnames([
                    'calendar-dayeventcell-inner alignleft flex',
                    !isAllDay && 'calendar-dayeventcell-inner--isNotAllDay',
                    !isEventReadLoading && 'calendar-dayeventcell-inner--isLoaded',
                    isSelected && 'calendar-dayeventcell-inner--isSelected',
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
