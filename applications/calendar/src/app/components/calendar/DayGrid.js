import React, { useMemo, useState, useRef, useLayoutEffect, useEffect } from 'react';
import { chunk } from 'proton-shared/lib/helpers/array';
import PropTypes from 'prop-types';
import { eachDayOfInterval, getWeekNumber, isSameDay } from 'proton-shared/lib/date-fns-utc';

import useDayGridEventLayout from './useDayGridEventLayout';
import createDayGridMouseHandler from './interactions/dayGridMouseHandler';
import { useRect } from '../../hooks/useRect';
import RowEvents from './DayGrid/RowEvents';
import DayButtons from './DayGrid/DayButtons';

export const getEvent = (idx, eventsInRow, events) => {
    const { idx: eventIdx } = eventsInRow[idx];
    return events[eventIdx];
};

const DayGrid = ({
    now,
    date,
    dateRange: [start, end],
    dateRange,
    displayWeekNumbers = false,
    isInteractionEnabled = false,
    components: { FullDayEvent, MoreFullDayEvent },
    events,
    targetEventRef,
    targetMoreRef,
    targetEventData,
    targetMoreData,
    onMouseDown,
    formatTime,
    formatDate,
    onClickDate,
    weekdaysLong = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
}) => {
    const rowsWrapperRef = useRef();
    const firstRowRef = useRef();
    const firstRowRect = useRect(firstRowRef.current);
    const [numberOfRows, setNumberOfRows] = useState(0);

    const daysInWeek = 7;
    const dayEventHeight = 28; // in px

    const rows = useMemo(() => {
        return chunk(eachDayOfInterval(start, end), daysInWeek);
    }, [+start, +end]);

    const eventsPerRows = useDayGridEventLayout(rows, events, numberOfRows, dayEventHeight);

    useLayoutEffect(() => {
        const { height: firstRowHeight = 100 } = firstRowRect || {};
        const newNumberOfRows = Math.max(Math.floor(firstRowHeight / dayEventHeight), 1);
        setNumberOfRows(newNumberOfRows - 1);
    }, [firstRowRect, dateRange]);

    const handleMouseDownRef = useRef();

    handleMouseDownRef.current = (e) => {
        createDayGridMouseHandler({
            e,
            events,
            eventsPerRows,
            rows,
            dayGridEl: rowsWrapperRef.current,
            onMouseDown
        });
    };

    useEffect(() => {
        if (!isInteractionEnabled) {
            return;
        }
        const listener = (e) => handleMouseDownRef.current(e);
        document.addEventListener('mousedown', listener, true);
        return () => {
            document.removeEventListener('mousedown', listener, true);
        };
    }, [isInteractionEnabled]);

    const formattedDates = useMemo(() => {
        return rows.map((days) => {
            return days.map(formatDate);
        });
    }, [rows, formatDate]);

    const mainRef = useRef();

    return (
        <div className="flex-item-fluid scroll-if-needed view-column-detail is-month-view">
            <div className="flex flex-column relative h100" ref={mainRef}>
                <div className="flex calendar-daygrid-days">
                    {displayWeekNumbers ? <div className="calendar-daygrid-weeknumber-width" /> : null}
                    {rows[0].map((day) => {
                        return (
                            <div
                                className="flex-item-fluid aligncenter calendar-daygrid-day big m0 p0-75 ellipsis"
                                key={day.getUTCDate()}
                                aria-current={day.getUTCDay() === now.getUTCDay() ? 'true' : null}
                            >
                                <span className="calendar-grid-heading-day-fullname">
                                    {weekdaysLong[day.getUTCDay()]}
                                </span>
                                <span
                                    className="calendar-grid-heading-day-shortname nodesktop notablet"
                                    aria-hidden="true"
                                >
                                    {weekdaysLong[day.getUTCDay()][0]}
                                </span>
                            </div>
                        );
                    })}
                </div>
                <div className="flex flex-item-fluid">
                    {displayWeekNumbers ? (
                        <div className="flex flex-column calendar-daygrid-weeknumber-width">
                            {rows.map((days) => {
                                const week = getWeekNumber(days[0]);
                                return (
                                    <div
                                        key={week}
                                        className="flex-item-fluid flex flex-column flex relative calendar-daygrid-weeknumber"
                                    >
                                        <span className="mauto opacity-40 small">{week}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : null}

                    <div className="flex flex-item-fluid flex-column calendar-daygrid-rows" ref={rowsWrapperRef}>
                        {rows.map((days, rowIndex) => {
                            const { eventsInRow, eventsInRowStyles, eventsInRowSummary } = eventsPerRows[rowIndex];
                            return (
                                <div key={rowIndex} className="flex-item-fluid flex flex-column h100 w100 relative">
                                    <div className="flex calendar-daygrid-columns no-pointer-events">
                                        {days.map((day) => {
                                            return (
                                                <div
                                                    className="flex-item-fluid calendar-daygrid-column"
                                                    key={day.getUTCDate()}
                                                />
                                            );
                                        })}
                                    </div>
                                    <div className="flex">
                                        <DayButtons
                                            days={days}
                                            now={now}
                                            date={date}
                                            formattedDates={formattedDates[rowIndex]}
                                            onClickDate={onClickDate}
                                        />
                                    </div>
                                    <div
                                        className="relative flex-item-fluid calendar-daygrid-row"
                                        data-row={rowIndex}
                                        {...(rowIndex === 0 ? { ref: firstRowRef } : undefined)}
                                    >
                                        <RowEvents
                                            FullDayEvent={FullDayEvent}
                                            MoreFullDayEvent={MoreFullDayEvent}

                                            eventsInRowStyles={eventsInRowStyles}
                                            eventsInRowSummary={eventsInRowSummary}
                                            eventsInRow={eventsInRow}
                                            events={events}

                                            formatTime={formatTime}
                                            now={now}

                                            targetMoreData={targetMoreData}
                                            targetMoreRef={targetMoreRef}

                                            targetEventRef={targetEventRef}
                                            targetEventData={targetEventData}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

DayGrid.propTypes = {
    children: PropTypes.func
};

export default DayGrid;
