import React, { useMemo } from 'react';
import { Icon, classnames } from 'react-components';

import { useReadCalendarEvent, useReadEvent } from './useReadCalendarEvent';
import { getConstrastingColor } from '../../helpers/color';

const FullDayEvent = ({
    style,
    formatTime,
    className = 'calendar-dayeventcell absolute alignleft',
    event: { start, data: { Calendar } = {}, data: targetEventData, isAllDay, isAllPartDay, tmpData },
    isSelected,
    isBeforeNow,
    isOutsideStart,
    isOutsideEnd,
    eventRef,
    onClick,
    tzid
}) => {
    const [value, loading, error] = useReadCalendarEvent(targetEventData);
    const model = useReadEvent(value, tzid);

    const calendarColor = (tmpData && tmpData.calendar.color) || Calendar.Color;

    const eventStyle = useMemo(() => {
        if (!isAllDay) {
            return {};
        }
        const background = calendarColor;
        return {
            background,
            color: getConstrastingColor(background)
        };
    }, [calendarColor, isAllDay, isSelected]);

    const startTimeString = useMemo(() => {
        return formatTime(start);
    }, [start]);

    const titleString = (tmpData && tmpData.title) || (!loading && model.title) || '';

    const content = (() => {
        if (error) {
            return <Icon name="lock" />;
        }

        return (
            <div className="flex flex-nowrap w100 bg-inherit">
                <span
                    className={classnames([
                        'flex-item-fluid flex flex-nowrap w100 flex-items-center',
                        loading && 'calendar-skeleton-loading'
                    ])}
                >
                    {!isAllDay ? (
                        <Icon className="mr0-25 flex-item-noshrink" size={12} name="circle" color={calendarColor} />
                    ) : null}

                    {isOutsideStart && !loading ? (
                        <Icon name="caret" size={12} className="flex-item-noshrink rotateZ-90" />
                    ) : null}

                    <span data-test-id="calendar-view:all-day-event" className="flex-item-fluid ellipsis">
                        {loading ? (
                            ''
                        ) : (
                            <>
                                {!isAllDay || isAllPartDay ? startTimeString : null} {titleString}
                            </>
                        )}
                    </span>

                    {isOutsideEnd && !loading ? (
                        <Icon name="caret" size={12} className="flex-item-noshrink rotateZ-270" />
                    ) : null}
                </span>
            </div>
        );
    })();

    return (
        <div
            style={style}
            className={classnames([
                className,
                isBeforeNow && 'calendar-dayeventcell--isBefore',
                isOutsideStart && 'calendar-dayeventcell--isOutsideStart',
                isOutsideEnd && 'calendar-dayeventcell--isOutsideEnd'
            ])}
            data-ignore-create="1"
        >
            <div
                onClick={onClick}
                className={classnames([
                    'calendar-dayeventcell-inner alignleft flex w100',
                    !isAllDay && 'calendar-dayeventcell-inner--notAllDay',
                    isOutsideStart && 'calendar-dayeventcell-inner--isOutsideStart',
                    isOutsideEnd && 'calendar-dayeventcell-inner--isOutsideEnd'
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
