import React, { useMemo, useRef, useState, useCallback, useImperativeHandle, useLayoutEffect, useEffect } from 'react';
import { eachDayOfInterval, format } from 'proton-shared/lib/date-fns-utc';
import PropTypes from 'prop-types';
import { classnames } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';
import { isSameDay } from 'proton-shared/lib/date-fns-utc';

import handleTimeGridMouseDown from './interactions/timeGridMouseHandler';
import handleDayGridMouseDown from './interactions/dayGridMouseHandler';
import { toPercent } from './mouseHelpers/mathHelpers';

import useTimeGridEventLayout from './useTimeGridEventLayout';
import useDayGridEventLayout from './useDayGridEventLayout';
import { getKey, toUTCMinutes } from './splitTimeGridEventsPerDay';
import HourLines from './TimeGrid/HourLines';
import HourTexts from './TimeGrid/HourTexts';
import DayLines from './TimeGrid/DayLines';
import DayButtons from './TimeGrid/DayButtons';
import DayEvents from './TimeGrid/DayEvents';
import RowEvents from './DayGrid/RowEvents';
import { disableScroll, enableScroll } from './mouseHelpers/scrollHelper';

const hours = Array.from({ length: 24 }, (a, i) => {
    return new Date(Date.UTC(2000, 0, 1, i));
});

const totalMinutes = 24 * 60;

const defaultFormat = (utcDate) => format(utcDate, 'p');

const TimeGrid = React.forwardRef(
    (
        {
            now,
            date,
            dateRange: [start, end],
            displaySecondaryTimezone,
            primaryTimezone,
            secondaryTimezone,
            secondaryTimezoneOffset = 0,
            events = [],
            components: { FullDayEvent, PartDayEvent, MoreFullDayEvent },
            formatTime = defaultFormat,
            onClickDate = noop,
            onMouseDown = noop,
            isInteractionEnabled = false,
            isScrollDisabled = false,
            weekdaysLong = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            targetEventRef,
            targetEventData,
            targetMoreRef,
            targetMoreData
        },
        ref
    ) => {
        const timeGridRef = useRef();
        const dayGridRef = useRef();
        const mainRef = useRef();
        const nowRef = useRef();
        const titleRef = useRef();
        const scrollRef = useRef();

        const [scrollTop, setScrollTop] = useState();

        const days = useMemo(() => {
            return eachDayOfInterval(start, end);
        }, [+start, +end]);

        const formattedHours = useMemo(() => {
            return hours.map(formatTime);
        }, [formatTime]);

        const formattedSecondaryHours = useMemo(() => {
            return hours.map((hourDate) => formatTime(new Date(hourDate.getTime() - secondaryTimezoneOffset)));
        }, [secondaryTimezoneOffset, formatTime]);

        const timeEvents = useMemo(() => events.filter((e) => !e.isAllDay), [events]);
        const dayEvents = useMemo(() => events.filter((e) => !!e.isAllDay), [events]);
        const daysRows = useMemo(() => [days], [days]);

        const dayEventHeight = 28;
        const numberOfRows = 3;

        const displayViewClass = days.length > 2 ? 'is-week-view' : 'is-day-view';

        const eventsPerRows = useDayGridEventLayout(daysRows, dayEvents, numberOfRows, dayEventHeight);

        const [{ eventsInRow, eventsInRowStyles, maxRows, eventsInRowSummary }] = eventsPerRows;
        const actualRows = Math.max(Math.min(maxRows, numberOfRows + 1), 1);

        const [eventsPerDay, eventsLaidOut] = useTimeGridEventLayout(timeEvents, days, totalMinutes);

        const nowTop = toUTCMinutes(now) / totalMinutes;
        const nowTopPercentage = toPercent(nowTop);

        const handleScroll = useCallback(({ target }) => {
            setScrollTop(target.scrollTop);
        }, []);

        useImperativeHandle(
            ref,
            () => ({
                scrollToNow: () => {
                    if (!scrollRef.current || !timeGridRef.current) {
                        return;
                    }
                    //const nowTop = nowRef.current.offsetTop;
                    const timeRect = timeGridRef.current.getBoundingClientRect();
                    const nowTopOffset = timeRect.height * nowTop;
                    const titleRect = titleRef.current.getBoundingClientRect();
                    const scrollRect = scrollRef.current.getBoundingClientRect();
                    scrollRef.current.scrollTop = nowTopOffset - scrollRect.height / 2 + titleRect.height / 2;
                }
            }),
            [ref, nowTop]
        );

        const handleMouseDownRef = useRef();

        handleMouseDownRef.current = (e) => {
            if (
                handleDayGridMouseDown({
                    e,
                    onMouseDown,
                    rows: daysRows,
                    events: dayEvents,
                    eventsPerRows,
                    dayGridEl: dayGridRef.current
                })
            ) {
                return;
            }

            if (
                handleTimeGridMouseDown({
                    e,
                    onMouseDown,
                    totalDays: days.length,
                    totalMinutes,
                    interval: 30,
                    events: timeEvents,
                    eventsPerDay,
                    days,
                    timeGridEl: timeGridRef.current,
                    scrollEl: scrollRef.current,
                    titleEl: titleRef.current
                })
            ) {
                return;
            }
        };

        useEffect(() => {
            if (!isInteractionEnabled) {
                return;
            }
            const handleMouseDown = (e) => handleMouseDownRef.current(e);
            document.addEventListener('mousedown', handleMouseDown, true);
            return () => {
                document.removeEventListener('mousedown', handleMouseDown, true);
            };
        }, [isInteractionEnabled]);

        useEffect(() => {
            const target = scrollRef.current;
            if (!target) {
                return;
            }
            if (isScrollDisabled) {
                disableScroll(target);
            } else {
                enableScroll(target);
            }
            return () => {
                if (isScrollDisabled) {
                    enableScroll(target);
                }
            };
        }, [!!isScrollDisabled, scrollRef.current]);

        useLayoutEffect(() => {
            ref.current.scrollToNow();
        }, []);

        return (
            <div
                className={classnames(['flex-item-fluid scroll-if-needed view-column-detail', displayViewClass])}
                onScroll={handleScroll}
                ref={scrollRef}
            >
                <div className="relative main-area-content" ref={mainRef}>
                    <div
                        ref={titleRef}
                        className={classnames([
                            'sticky-title sticky-title--noPadding onmobile-remain-sticky',
                            !scrollTop && 'sticky-title--onTop'
                        ])}
                    >
                        <div className="flex calendar-first-row-heading">
                            {displaySecondaryTimezone ? (
                                <div className="calendar-aside aligncenter flex flex-column flex-justify-end">
                                    <div className="calendar-secondary-timezone-cell calendar-secondary-timezone-cell--header">
                                        {secondaryTimezone}
                                    </div>
                                </div>
                            ) : null}
                            <div className="calendar-aside flex flex-column flex-justify-end">
                                <div className="aligncenter">{primaryTimezone}</div>
                            </div>
                            <DayButtons
                                days={days}
                                now={now}
                                date={date}
                                onClickDate={onClickDate}
                                weekdaysLong={weekdaysLong}
                            />
                        </div>

                        <div className="flex calendar-fullday-row">
                            {displaySecondaryTimezone ? <div className="calendar-aside"></div> : null}
                            <div className="calendar-aside calendar-aside-weekNumber aligncenter"></div>
                            <div className="flex-item-fluid relative">
                                <DayLines days={days} />
                                <div
                                    className="calendar-time-fullday"
                                    style={{ height: actualRows * dayEventHeight + 'px' }}
                                    data-row="0"
                                    ref={dayGridRef}
                                >
                                    <RowEvents
                                        FullDayEvent={FullDayEvent}
                                        MoreFullDayEvent={MoreFullDayEvent}
                                        eventsInRowStyles={eventsInRowStyles}
                                        eventsInRowSummary={eventsInRowSummary}
                                        eventsInRow={eventsInRow}
                                        events={dayEvents}
                                        formatTime={formatTime}
                                        now={now}
                                        row={0}
                                        targetMoreData={targetMoreData}
                                        targetMoreRef={targetMoreRef}
                                        targetEventRef={targetEventRef}
                                        targetEventData={targetEventData}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex">
                        {displaySecondaryTimezone ? (
                            <HourTexts
                                className="calendar-aside calendar-secondary-timezone-cell"
                                hours={formattedSecondaryHours}
                            />
                        ) : null}
                        <HourTexts className="calendar-aside calendar-primary-timezone-cell" hours={formattedHours} />
                        <div className="flex flex-item-fluid relative calendar-grid-gridcells" ref={timeGridRef}>
                            <HourLines hours={hours} />
                            {days.map((day, dayIndex) => {
                                const key = getKey(day);
                                return (
                                    <div className="flex-item-fluid relative calendar-grid-gridcell h100" key={key}>
                                        <DayEvents
                                            Component={PartDayEvent}
                                            eventsPerDay={eventsPerDay[key]}
                                            eventsLaidOut={eventsLaidOut[key]}
                                            timeEvents={timeEvents}
                                            dayIndex={dayIndex}
                                            targetEventData={targetEventData}
                                            targetEventRef={targetEventRef}
                                            formatTime={formatTime}
                                            now={now}
                                        />
                                        {isSameDay(day, now) ? (
                                            <div
                                                className="calendar-grid-nowHourLine absolute"
                                                ref={nowRef}
                                                style={{ top: nowTopPercentage }}
                                            />
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);

TimeGrid.propTypes = {
    children: PropTypes.func,
    onCreateEvent: PropTypes.func,
    onEditEvent: PropTypes.func,
    onClickDate: PropTypes.func,
    isInteractionEnabled: PropTypes.bool,
    defaultEventDuration: PropTypes.number,
    events: PropTypes.array,
    dateRange: PropTypes.array,
    now: PropTypes.instanceOf(Date),
    scrollRef: PropTypes.object
};

export default TimeGrid;
