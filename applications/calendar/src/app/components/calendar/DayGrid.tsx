import React, { useMemo, useState, useRef, useLayoutEffect, useEffect, Ref } from 'react';
import { chunk } from '@proton/shared/lib/helpers/array';
import { eachDayOfInterval, isSameMonth } from '@proton/shared/lib/date-fns-utc';
import { getISOWeek } from 'date-fns';

import useDayGridEventLayout from './useDayGridEventLayout';
import createDayGridMouseHandler from './interactions/dayGridMouseHandler';
import { useRect } from '../../hooks/useRect';
import RowEvents from './DayGrid/RowEvents';
import DayButtons from './DayGrid/DayButtons';
import { DAY_EVENT_HEIGHT } from './constants';
import { CalendarViewEvent, TargetEventData, TargetMoreData } from '../../containers/calendar/interface';

interface Props {
    tzid: string;
    now: Date;
    date: Date;
    dateRange: [Date, Date];
    displayWeekNumbers?: boolean;
    isInteractionEnabled?: boolean;
    events: CalendarViewEvent[];
    targetEventRef: Ref<HTMLDivElement>;
    targetMoreData?: TargetMoreData;
    targetMoreRef: Ref<HTMLDivElement>;
    targetEventData?: TargetEventData;
    onMouseDown: (a: any) => any /** todo */;
    formatTime: (date: Date) => string;
    formatDate: (date: Date) => string;
    onClickDate: (date: Date) => void;
    weekdaysLong: string[];
}

const DayGrid = ({
    tzid,
    now,
    date,
    dateRange: [start, end],
    dateRange,
    displayWeekNumbers = false,
    isInteractionEnabled = false,
    events,
    targetEventRef,
    targetMoreRef,
    targetEventData,
    targetMoreData,
    onMouseDown,
    formatTime,
    formatDate,
    onClickDate,
    weekdaysLong = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
}: Props) => {
    const rowsWrapperRef = useRef<HTMLDivElement>(null);
    const firstRowRef = useRef<HTMLDivElement>(null);
    const firstRowRect = useRect(firstRowRef.current);
    const [numberOfRows, setNumberOfRows] = useState(0);

    const daysInWeek = 7;
    const dayEventHeight = DAY_EVENT_HEIGHT;

    const rows = useMemo(() => {
        return chunk(eachDayOfInterval(start, end), daysInWeek);
    }, [+start, +end]);

    const eventsPerRows = useDayGridEventLayout(rows, events, numberOfRows, dayEventHeight);

    useLayoutEffect(() => {
        const { height: firstRowHeight = 100 } = firstRowRect || {};
        const newNumberOfRows = Math.max(Math.floor(firstRowHeight / dayEventHeight), 1);
        setNumberOfRows(newNumberOfRows - 1);
    }, [firstRowRect, dateRange]);

    const handleMouseDownRef = useRef<(e: MouseEvent) => void>();

    handleMouseDownRef.current = (e: MouseEvent) => {
        if (!rowsWrapperRef.current) {
            return;
        }
        createDayGridMouseHandler({
            e,
            events,
            eventsPerRows,
            rows,
            dayGridEl: rowsWrapperRef.current,
            onMouseDown,
        });
    };

    useEffect(() => {
        if (!isInteractionEnabled) {
            return;
        }
        const listener = (e: MouseEvent) => {
            if (e.button !== 0) {
                return;
            }
            handleMouseDownRef.current?.(e);
        };
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

    const mainRef = useRef<HTMLDivElement>(null);

    return (
        <div className="flex-item-fluid scroll-if-needed h100 is-month-view">
            <div className="calendar-daygrid flex flex-column relative h100" ref={mainRef}>
                <div data-test-id="calendar-month-view:week-header" className="flex calendar-daygrid-days">
                    {displayWeekNumbers ? <div className="calendar-daygrid-weeknumber-width" /> : null}
                    {rows[0].map((day) => {
                        return (
                            <div
                                className="flex-item-fluid text-center calendar-daygrid-day text-lg m0 p0-75 text-ellipsis"
                                key={day.getUTCDate()}
                                aria-current={
                                    day.getUTCDay() === now.getUTCDay() && isSameMonth(date, now) ? 'true' : undefined
                                }
                            >
                                <span className="calendar-grid-heading-day-fullname text-semibold">
                                    {weekdaysLong[day.getUTCDay()]}
                                </span>
                                <span
                                    className="calendar-grid-heading-day-shortname no-desktop no-tablet"
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
                                const monday = days.find((date) => date.getDay() === 1);
                                if (!monday) {
                                    return null;
                                }
                                const week = getISOWeek(monday);
                                return (
                                    <div
                                        key={+monday}
                                        className="flex-item-fluid flex flex-column flex relative calendar-daygrid-weeknumber"
                                    >
                                        <span className="mauto opacity-40 text-sm">{week}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : null}

                    <div className="flex flex-item-fluid flex-column calendar-daygrid-rows" ref={rowsWrapperRef}>
                        {rows.map((days, rowIndex) => {
                            const { eventsInRow, eventsInRowStyles, eventsInRowSummary } = eventsPerRows[rowIndex];
                            return (
                                // eslint-disable-next-line react/no-array-index-key
                                <div key={rowIndex} className="flex-item-fluid flex flex-column h100 w100 relative">
                                    <div
                                        data-test-id="calendar-month-view:week-row"
                                        className="flex calendar-daygrid-columns no-pointer-events"
                                    >
                                        {days.map((day) => {
                                            return (
                                                <div
                                                    data-test-id="calendar-month-view:day-cell"
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
                                            tzid={tzid}
                                            eventsInRowStyles={eventsInRowStyles}
                                            eventsInRowSummary={eventsInRowSummary}
                                            eventsInRow={eventsInRow}
                                            events={events}
                                            formatTime={formatTime}
                                            days={days}
                                            now={now}
                                            row={rowIndex}
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

export default DayGrid;
