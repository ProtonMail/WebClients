import React, { CSSProperties, Ref, useMemo } from 'react';
import { classnames, Icon } from 'react-components';
import { getDisplayTitle } from '../../helpers/event';

import { useReadCalendarEvent, useReadEvent } from './useReadCalendarEvent';
import { getConstrastingColor } from '../../helpers/color';
import { getEventErrorMessage, getEventLoadingMessage } from './error';
import { CalendarViewEvent, CalendarViewEventTemporaryEvent } from '../../containers/calendar/interface';
import getIsTemporaryViewEvent from '../../containers/calendar/getIsTemporaryViewEvent';

interface Props {
    style: CSSProperties;
    formatTime: (date: Date) => string;
    event: CalendarViewEvent | CalendarViewEventTemporaryEvent;
    isSelected: boolean;
    isBeforeNow: boolean;
    eventRef: Ref<HTMLDivElement>;
    tzid: string;
}
const PartDayEvent = ({ style, formatTime, event, isSelected, isBeforeNow, eventRef, tzid }: Props) => {
    const { start, end, data: targetEventData, isAllDay } = event;
    const { Calendar } = targetEventData;

    const [value, loading, error] = useReadCalendarEvent(targetEventData);
    const model = useReadEvent(value, tzid);

    const tmpData = getIsTemporaryViewEvent(event) ? event.tmpData : undefined;
    const calendarColor = tmpData?.calendar.color || Calendar.Color;
    const safeTitle = getDisplayTitle(tmpData?.title || model.title);

    const eventStyle = useMemo(() => {
        const background = calendarColor;
        return {
            ...style,
            '--background': background,
            '--foreground': getConstrastingColor(background),
        };
    }, [calendarColor, style, isAllDay, isSelected]);

    const titleString = (() => {
        if (error) {
            return '';
        }
        if (loading) {
            return '…';
        }
        return safeTitle;
    })();

    const expandableTitleString = (() => {
        if (error) {
            return getEventErrorMessage(error);
        }
        if (loading) {
            return getEventLoadingMessage();
        }
        return titleString;
    })();

    const timeString = useMemo(() => {
        const timeStart = formatTime(start);
        const timeEnd = formatTime(end);
        return `${timeStart} - ${timeEnd}`;
    }, [start, end]);

    const isLessThanOneHour = +end - +start < 3600000;
    const shouldHideTime = loading || (isLessThanOneHour && titleString);

    const content = (() => {
        if (error) {
            return (
                <div className="flex flex-nowrap flex-items-center">
                    <Icon name="lock" className="calendar-eventcell-lock-icon" />
                    <span className="flex-item-fluid ellipsis">&nbsp;</span>
                </div>
            );
        }

        return (
            <>
                <div data-test-id="calendar-day-week-view:part-day-event" className="ellipsis calendar-eventcell-title">
                    {titleString}
                </div>
                <div className={classnames(['ellipsis calendar-eventcell-timestring', shouldHideTime && 'hidden'])}>
                    {timeString}
                </div>
            </>
        );
    })();

    return (
        <div
            role="button"
            tabIndex={0}
            style={eventStyle}
            className={classnames([
                'calendar-eventcell no-scroll pl0-5 pr0-5',
                !loading && 'calendar-eventcell--isLoaded',
                isBeforeNow && 'calendar-eventcell--isBefore',
                isSelected && 'calendar-eventcell--isSelected',
            ])}
            ref={eventRef}
            title={expandableTitleString}
        >
            {content}
        </div>
    );
};

export default PartDayEvent;
