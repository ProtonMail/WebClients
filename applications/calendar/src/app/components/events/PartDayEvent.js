import React, { useMemo } from 'react';
import { LoaderIcon } from 'react-components';
import { c } from 'ttag';

import './PartDayEvent.scss';
import { useReadCalendarEvent, useReadEvent } from './useReadCalendarEvent';

const getBackground = (id, isAllDay, isSelected) => {
    if (isSelected) {
        return 'rgba(255,0,255,0.1)';
    }
    if (id === 'tmp') {
        return 'rgba(255,0,255,0.3)';
    }
    return '';
};

const PartDayEvent = ({ style, formatTime, event: { start, end, data, id, isAllDay }, isSelected, eventRef }) => {
    const [value, loading, error] = useReadCalendarEvent(data);
    const model = useReadEvent(value);
    const calendarColor = (data && data.Calendar && data.Calendar.Color) || undefined;

    const eventStyle = useMemo(() => {
        return {
            ...style,
            background: calendarColor || getBackground(id, isAllDay, isSelected)
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

    return (
        <div style={eventStyle} className="eventcell pl0-5 pr0-5" ref={eventRef}>
            {content}
        </div>
    );
};

export default PartDayEvent;
