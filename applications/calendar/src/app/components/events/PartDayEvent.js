import React, { useMemo } from 'react';
import { classnames } from 'react-components';
import { c } from 'ttag';

import { useReadCalendarEvent, useReadEvent } from './useReadCalendarEvent';
import { bestColor } from '../../helpers/color';

const PartDayEvent = ({
    style,
    formatTime,
    event: { start, end, data: { Calendar } = {}, data: targetEventData, isAllDay },
    isSelected,
    isBeforeNow,
    eventRef
}) => {
    const [value, loading, error] = useReadCalendarEvent(targetEventData);
    const model = useReadEvent(value);
    const calendarColor = Calendar.Color;
    const eventStyle = useMemo(() => {
        const background = calendarColor;
        return {
            ...style,
            background,
            color: bestColor(background)
        };
    }, [calendarColor, style, isAllDay, isSelected]);

    const timeString = useMemo(() => {
        const timeStart = formatTime(start);
        const timeEnd = formatTime(end);
        return `${timeStart} - ${timeEnd}`;
    }, [start, end]);

    const content = (() => {
        if (error) {
            return (
                <div className="ellipsis">
                    {c('Error').t`Error: `}
                    {error && error.message}
                </div>
            );
        }

        return (
            <>
                <div className={classnames(['ellipsis', loading && 'calendar-skeleton-loading'])}>
                    {loading ? '' : model.title}
                </div>
                <div className="ellipsis">{timeString}</div>
            </>
        );
    })();

    const isBeforeNowClassModifier = isBeforeNow ? 'calendar-eventcell--isBefore' : '';

    return (
        <div
            style={eventStyle}
            className={classnames(['calendar-eventcell pl0-5 pr0-5', isBeforeNowClassModifier])}
            ref={eventRef}
        >
            {content}
        </div>
    );
};

export default PartDayEvent;
