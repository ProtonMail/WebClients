import { ComponentPropsWithoutRef, ReactNode, Ref, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { getISOWeek } from 'date-fns';

import { eachDayOfInterval, isSameMonth } from '@proton/shared/lib/date-fns-utc';
import chunk from '@proton/utils/chunk';

import { CalendarViewEvent, TargetEventData, TargetMoreData } from '../../containers/calendar/interface';
import { useRect } from '../../hooks/useRect';
import DayButtons from './DayGrid/DayButtons';
import RowEvents from './DayGrid/RowEvents';
import { DAY_EVENT_HEIGHT } from './constants';
import createDayGridMouseHandler from './interactions/dayGridMouseHandler';
import useDayGridEventLayout from './useDayGridEventLayout';

interface Props extends ComponentPropsWithoutRef<'div'> {
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
    children?: ReactNode; // Needed for the dropzone
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
    children,
    ...rest
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

    return (
        <div className="flex-1 overflow-auto h-full is-month-view" {...rest}>
            {children}
            <div className="calendar-daygrid flex flex-column relative h-full">
                <div data-testid="calendar-month-view:week-header" className="flex calendar-daygrid-days">
                    {displayWeekNumbers ? <div className="calendar-daygrid-weeknumber-width" /> : null}
                    {rows[0].map((day) => {
                        return (
                            <div
                                className="flex-1 text-center calendar-daygrid-day text-lg m-0 p-3 text-ellipsis"
                                key={day.getUTCDate()}
                                aria-current={
                                    day.getUTCDay() === now.getUTCDay() && isSameMonth(date, now) ? 'true' : undefined
                                }
                            >
                                <span className="calendar-grid-heading-day-fullname text-semibold">
                                    {weekdaysLong[day.getUTCDay()]}
                                </span>
                                <span className="calendar-grid-heading-day-shortname md:hidden" aria-hidden="true">
                                    {weekdaysLong[day.getUTCDay()][0]}
                                </span>
                            </div>
                        );
                    })}
                </div>
                <div className="flex flex-1">
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
                                        className="flex-1 flex flex-column flex relative calendar-daygrid-weeknumber"
                                    >
                                        <span className="m-auto opacity-40 text-sm">{week}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : null}

                    <div className="flex flex-1 flex-column calendar-daygrid-rows" ref={rowsWrapperRef}>
                        {rows.map((days, rowIndex) => {
                            const { eventsInRow, eventsInRowStyles, eventsInRowSummary } = eventsPerRows[rowIndex];

                            return (
                                // eslint-disable-next-line react/no-array-index-key
                                <div key={rowIndex} className="flex-1 flex flex-column h-full w-full relative">
                                    <div
                                        data-testid="calendar-month-view:week-row"
                                        className="flex calendar-daygrid-columns pointer-events-none"
                                    >
                                        {days.map((day) => {
                                            return (
                                                <div
                                                    data-testid="calendar-month-view:day-cell"
                                                    className="flex-1 calendar-daygrid-column"
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
                                    {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
                                    <div
                                        className="relative flex-1 calendar-daygrid-row unstyled"
                                        role="list"
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
