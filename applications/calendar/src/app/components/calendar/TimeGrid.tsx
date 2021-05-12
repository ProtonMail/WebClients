import React, {
    useMemo,
    useRef,
    useState,
    useCallback,
    useImperativeHandle,
    useLayoutEffect,
    useEffect,
    Ref,
    RefObject,
} from 'react';
import { eachDayOfInterval, format, isSameDay } from 'proton-shared/lib/date-fns-utc';
import { classnames } from 'react-components';

import handleTimeGridMouseDown from './interactions/timeGridMouseHandler';
import handleDayGridMouseDown from './interactions/dayGridMouseHandler';
import { OnMouseDown } from './interactions/interface';
import { toPercent } from './mouseHelpers/mathHelpers';

import useDayGridEventLayout from './useDayGridEventLayout';
import { getKey, splitTimeGridEventsPerDay, toUTCMinutes } from './splitTimeGridEventsPerDay';
import HourLines from './TimeGrid/HourLines';
import HourTexts from './TimeGrid/HourTexts';
import DayLines from './TimeGrid/DayLines';
import DayButtons from './TimeGrid/DayButtons';
import DayEvents from './TimeGrid/DayEvents';
import RowEvents from './DayGrid/RowEvents';
import { disableScroll, enableScroll } from './mouseHelpers/scrollHelper';
import { CalendarViewEvent, TargetEventData, TargetMoreData } from '../../containers/calendar/interface';

const hours = Array.from({ length: 24 }, (a, i) => {
    return new Date(Date.UTC(2000, 0, 1, i));
});

const totalMinutes = 24 * 60;

const defaultFormat = (utcDate: Date) => format(utcDate, 'p');

export interface TimeGridActionRef {
    scrollToNow: () => void;
}

interface Props {
    isNarrow?: boolean;
    displaySecondaryTimezone?: boolean;
    primaryTimezone: string;
    secondaryTimezone?: string;
    secondaryTimezoneOffset?: number;
    tzid: string;
    now: Date;
    date: Date;
    dateRange: [Date, Date];
    isInteractionEnabled?: boolean;
    isScrollDisabled?: boolean;
    events?: CalendarViewEvent[];
    targetEventRef?: Ref<HTMLDivElement>;
    targetMoreData?: TargetMoreData;
    targetMoreRef?: Ref<HTMLDivElement>;
    targetEventData?: TargetEventData;
    onMouseDown?: OnMouseDown;
    formatTime?: (date: Date) => string;
    onClickDate?: (date: Date) => void;
    weekdaysLong?: string[];
    actionRef: RefObject<TimeGridActionRef>;
}

const TimeGrid = ({
    isNarrow = false,
    now,
    date,
    dateRange: [start, end],
    tzid,
    displaySecondaryTimezone = false,
    primaryTimezone,
    secondaryTimezone,
    secondaryTimezoneOffset = 0,
    events = [],
    formatTime = defaultFormat,
    onClickDate,
    onMouseDown,
    isInteractionEnabled = false,
    isScrollDisabled = false,
    weekdaysLong = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    targetEventRef,
    targetEventData,
    targetMoreRef,
    targetMoreData,
    actionRef,
}: Props) => {
    const timeGridRef = useRef<HTMLDivElement>(null);
    const dayGridRef = useRef<HTMLDivElement>(null);
    const mainRef = useRef<HTMLDivElement>(null);
    const nowRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const [scrollTop, setScrollTop] = useState<number>();

    const days = useMemo(() => {
        return eachDayOfInterval(start, end);
    }, [+start, +end]);

    const formattedHours = useMemo(() => {
        return hours.map(formatTime);
    }, [formatTime]);

    const formattedSecondaryHours = useMemo(() => {
        return hours.map((hourDate) => formatTime(new Date(hourDate.getTime() - secondaryTimezoneOffset)));
    }, [secondaryTimezoneOffset, formatTime]);

    const [timeEvents, dayEvents] = useMemo(() => {
        return events.reduce<[CalendarViewEvent[], CalendarViewEvent[]]>(
            (acc, event) => {
                acc[!event.isAllDay ? 0 : 1].push(event);
                return acc;
            },
            [[], []]
        );
    }, [events]);

    const daysRows = useMemo(() => {
        if (isNarrow) {
            return [[date]];
        }
        return [days];
    }, [days, isNarrow, date]);

    const dayEventHeight = 28;
    const numberOfRows = 3;

    const displayViewClass = days.length > 2 ? 'is-week-view' : 'is-day-view';

    const eventsPerRows = useDayGridEventLayout(daysRows, dayEvents, numberOfRows, dayEventHeight);

    const [{ eventsInRow, eventsInRowStyles, maxRows, eventsInRowSummary }] = eventsPerRows;
    const actualRows = Math.max(Math.min(maxRows, numberOfRows + 1), 1);

    const eventsPerDay = useMemo(() => {
        return splitTimeGridEventsPerDay({
            events: timeEvents,
            min: days[0],
            max: days[days.length - 1],
            totalMinutes,
        });
    }, [timeEvents, days, totalMinutes]);

    const nowTop = toUTCMinutes(now) / totalMinutes;
    const nowTopPercentage = toPercent(nowTop);

    const handleScroll = useCallback(({ target }) => {
        setScrollTop(target.scrollTop);
    }, []);

    const scrollToTime = useCallback((date: Date) => {
        if (!scrollRef.current || !timeGridRef.current || !titleRef.current) {
            return;
        }
        const timeRect = timeGridRef.current.getBoundingClientRect();
        const timeTop = toUTCMinutes(date) / totalMinutes;
        const topOffset = timeRect.height * timeTop;
        const titleRect = titleRef.current.getBoundingClientRect();
        const scrollRect = scrollRef.current.getBoundingClientRect();
        scrollRef.current.scrollTop = topOffset - scrollRect.height / 2 + titleRect.height / 2;
    }, []);

    useImperativeHandle(
        actionRef,
        () => ({
            scrollToTime,
            scrollToNow: () => {
                return scrollToTime(now);
            },
        }),
        [actionRef, now]
    );

    const handleMouseDownRef = useRef<(e: MouseEvent) => void>();

    handleMouseDownRef.current = (e: MouseEvent) => {
        if (!onMouseDown) {
            return;
        }

        if (dayGridRef.current) {
            handleDayGridMouseDown({
                e,
                onMouseDown,
                rows: daysRows,
                events: dayEvents,
                eventsPerRows,
                dayGridEl: dayGridRef.current,
            });
        }

        const normalizedDays = isNarrow ? [date] : days;

        if (!days[0]) {
            return;
        }

        if (!timeGridRef.current || !scrollRef.current || !titleRef.current) {
            return;
        }

        handleTimeGridMouseDown({
            e,
            onMouseDown,
            totalDays: normalizedDays.length,
            totalMinutes,
            interval: 30,
            events: timeEvents,
            eventsPerDay,
            days: normalizedDays,
            timeGridEl: timeGridRef.current,
            scrollEl: scrollRef.current,
            titleEl: titleRef.current,
        });
    };

    useEffect(() => {
        if (!isInteractionEnabled) {
            return;
        }
        const handleMouseDown = (e: MouseEvent) => {
            if (e.button !== 0) {
                return;
            }
            handleMouseDownRef.current?.(e);
        };
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
        actionRef.current?.scrollToNow();
    }, []);

    return (
        <div
            className={classnames(['flex-item-fluid scroll-if-needed h100', displayViewClass])}
            onScroll={handleScroll}
            ref={scrollRef}
        >
            <div className="relative main-area-content" ref={mainRef}>
                <div
                    ref={titleRef}
                    className={classnames([
                        'sticky-title sticky-title--no-padding on-mobile-remain-sticky',
                        !scrollTop && 'sticky-title--on-top',
                    ])}
                >
                    <div data-test-id="calendar-day-week-view:week-header" className="flex calendar-first-row-heading">
                        {displaySecondaryTimezone ? (
                            <div className="calendar-aside text-center flex flex-column flex-justify-end">
                                <div className="calendar-secondary-timezone-cell calendar-secondary-timezone-cell--header">
                                    {secondaryTimezone}
                                </div>
                            </div>
                        ) : null}
                        <div className="calendar-aside flex flex-column flex-justify-end">
                            <div className="text-center">{primaryTimezone}</div>
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
                        {displaySecondaryTimezone ? <div className="calendar-aside" /> : null}
                        <div className="calendar-aside calendar-aside-weekNumber text-center" />
                        <div className="flex-item-fluid relative">
                            <DayLines days={daysRows[0]} />
                            <div
                                className="calendar-time-fullday"
                                style={{ height: `${(actualRows * dayEventHeight) / 16}rem` }}
                                data-row="0"
                                ref={dayGridRef}
                            >
                                <RowEvents
                                    tzid={tzid}
                                    eventsInRowStyles={eventsInRowStyles}
                                    eventsInRowSummary={eventsInRowSummary}
                                    eventsInRow={eventsInRow}
                                    events={dayEvents}
                                    formatTime={formatTime}
                                    days={daysRows[0]}
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
                            const isActiveDay = isSameDay(day, date);
                            if (isNarrow && !isActiveDay) {
                                return null;
                            }
                            return (
                                <div
                                    data-test-id="calendar-week-day-view:weekday-column"
                                    className="flex-item-fluid relative calendar-grid-gridcell h100"
                                    key={key}
                                >
                                    <DayEvents
                                        tzid={tzid}
                                        events={timeEvents}
                                        eventsInDay={eventsPerDay[key]}
                                        dayIndex={isNarrow ? 0 : dayIndex}
                                        totalMinutes={totalMinutes}
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
};

export default TimeGrid;
