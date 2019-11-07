import React, { useMemo } from 'react';
import { LoaderIcon } from 'react-components';

import './FullDayEvent.scss';
import { useReadCalendarEvent, useReadEvent } from './useReadCalendarEvent';
import { c } from 'ttag';

const FullDayEvent = ({
    style,
    formatTime,
    className = 'dayeventcell absolute',
    event: { start, end, data, id, isAllDay },
    event,
    isSelected,
    isBeforeNow,
    eventRef,
    onClick
}) => {
    const [value, loading, error] = useReadCalendarEvent(data);
    const model = useReadEvent(value);

    const calendarColor = (data && data.Calendar && data.Calendar.Color) || undefined;

    const eventStyle = useMemo(() => {
        if (!isAllDay) {
            return {};
        }
        return {
            background: calendarColor || 'rgba(255,0,255,0.3)'
        };
    }, [calendarColor, isAllDay, isSelected]);

    const timeString = useMemo(() => {
        return formatTime(start);
    }, [start]);

    const isCreateEvent = event.id === 'tmp' && !event.data;

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
            <div className="flex flex-nowrap">
                <span className="ellipsis flex-item-fluid">{model.title}</span>
                {isCreateEvent || (isAllDay && model.isAllDay) ? null : <span className="">{timeString}</span>}
            </div>
        );
    })();

    return (
        <div style={style} className={className} data-ignore-create="1" onClick={onClick}>
            <div className="dayeventcell--inner pl0-5 pr0-5" style={eventStyle} ref={eventRef}>
                {content}
            </div>
        </div>
    );
};

export default FullDayEvent;
