import React, { useMemo } from 'react';
import { LoaderIcon, classnames } from 'react-components';
import { c } from 'ttag';

import { useReadCalendarEvent, useReadEvent } from './useReadCalendarEvent';
import { bestColor } from '../../helpers/color';

const getBackground = (id, isAllDay, isSelected) => {
    if (isSelected) {
        return 'rgba(255,0,255,0.1)';
    }
    if (id === 'tmp') {
        return 'rgba(255,0,255,0.3)';
    }
    return '';
};

const PartDayEvent = ({
    style,
    formatTime,
    event: { start, end, data, id, isAllDay },
    isSelected,
    isBeforeNow,
    eventRef
}) => {
    const [value, loading, error] = useReadCalendarEvent(data);
    const model = useReadEvent(value);
    const calendarColor = (data && data.Calendar && data.Calendar.Color) || undefined;

    const eventStyle = useMemo(() => {
        const background = calendarColor || getBackground(id, isAllDay, isSelected);
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

        if (loading) {
            <LoaderIcon />;
        }

        return (
            <>
                <div className="ellipsis">{loading ? <LoaderIcon /> : model.title}</div>
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
