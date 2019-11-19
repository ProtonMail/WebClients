import React, { useMemo } from 'react';
import { Icon, classnames } from 'react-components';
import { c } from 'ttag';

import { useReadCalendarEvent, useReadEvent } from './useReadCalendarEvent';
import { bestColor } from '../../helpers/color';

const FullDayEvent = ({
    style,
    formatTime,
    className = 'calendar-dayeventcell absolute alignleft',
    event: { start, data: { Calendar } = {}, data: targetEventData, isAllDay, isAllPartDay },
    isSelected,
    isBeforeNow,
    eventRef,
    onClick
}) => {
    const [value, loading, error] = useReadCalendarEvent(targetEventData);
    const model = useReadEvent(value);

    const calendarColor = Calendar.Color;

    const eventStyle = useMemo(() => {
        if (!isAllDay) {
            return {};
        }
        const background = calendarColor;
        return {
            background,
            color: bestColor(background)
        };
    }, [calendarColor, isAllDay, isSelected]);

    const timeString = useMemo(() => {
        return formatTime(start);
    }, [start]);

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
            <div className="flex flex-nowrap bg-inherit">
                <span
                    className={classnames([
                        'flex-item-fluid flex flex-nowrap flex-items-center',
                        loading && 'calendar-skeleton-loading'
                    ])}
                >
                    {!isAllDay ? (
                        <Icon className="mr0-25 flex-item-noshrink" size={12} name="circle" color={calendarColor} />
                    ) : null}
                    {loading ? '' : <span className="flex-item-fluid ellipsis">{model.title}</span>}
                </span>
                {isAllPartDay ? <span className="">{timeString}</span> : null}
            </div>
        );
    })();

    const isBeforeNowClassModifier = isBeforeNow ? 'calendar-dayeventcell--isBefore' : '';

    return (
        <button
            type="button"
            style={style}
            className={classnames([className, isBeforeNowClassModifier])}
            data-ignore-create="1"
            onClick={onClick}
        >
            <span className="calendar-dayeventcell-inner inbl w100 pl0-5 pr0-5" style={eventStyle} ref={eventRef}>
                {content}
            </span>
        </button>
    );
};

export default FullDayEvent;
