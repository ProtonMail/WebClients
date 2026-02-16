import type { ComponentPropsWithoutRef, ReactNode, Ref, RefObject } from 'react';
import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { compareAsc } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import ButtonGroup from '@proton/components/components/button/ButtonGroup';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import useElementRect from '@proton/components/hooks/useElementRect';
import { IcChevronLeft } from '@proton/icons/icons/IcChevronLeft';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { VIEWS } from '@proton/shared/lib/calendar/constants';
import { addDays, eachDayOfInterval, format, isSameDay } from '@proton/shared/lib/date-fns-utc';
import formatUTC from '@proton/shared/lib/date-fns-utc/format';
import { dateLocale } from '@proton/shared/lib/i18n';
import clsx from '@proton/utils/clsx';

import { useBookings } from '../../containers/bookings/bookingsProvider/BookingsProvider';
import { isBookingSlotEvent } from '../../containers/bookings/utils/calendar/calendarHelper';
import type {
    CalendarViewBusyEvent,
    CalendarViewEvent,
    TargetEventData,
    TargetMoreData,
} from '../../containers/calendar/interface';
import { isBusySlotEvent } from '../../helpers/busySlots';
import { getNavigationArrowsText } from '../../helpers/i18n';
import { selectAttendeesBusySlots } from '../../store/busySlots/busySlotsSelectors';
import { useCalendarSelector } from '../../store/hooks';
import { PartDayEventView } from '../events/PartDayEvent';
import RowEvents from './DayGrid/RowEvents';
import DayButtons from './TimeGrid/DayButtons';
import DayEvents from './TimeGrid/DayEvents';
import HourLines from './TimeGrid/HourLines';
import HourTexts from './TimeGrid/HourTexts';
import handleDayGridMouseDown from './interactions/dayGridMouseHandler';
import type { OnMouseDown } from './interactions/interface';
import handleTimeGridMouseDown from './interactions/timeGridMouseHandler';
import { toPercent } from './mouseHelpers/mathHelpers';
import { disableScroll, enableScroll } from './mouseHelpers/scrollHelper';
import { getKey, splitTimeGridEventsPerDay, toUTCMinutes } from './splitTimeGridEventsPerDay';
import useDayGridEventLayout from './useDayGridEventLayout';

const hours = Array.from({ length: 24 }, (a, i) => {
    return new Date(Date.UTC(2000, 0, 1, i));
});

const totalMinutes = 24 * 60;

const defaultFormat = (utcDate: Date) => format(utcDate, 'p');

export interface TimeGridActionRef {
    scrollToNow: () => void;
}

interface Props extends Omit<ComponentPropsWithoutRef<'div'>, 'onMouseDown'> {
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
    onChangeDate?: (date: Date) => void;
    onClickToday?: () => void;
    weekdays?: string[];
    weekdaysSingle?: string[];
    actionRef: RefObject<TimeGridActionRef>;
    isDrawerApp?: boolean;
    children?: ReactNode; // Needed for the dropzone
}

const TimeGrid = ({
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
    onChangeDate,
    onClickToday,
    onMouseDown,
    isInteractionEnabled = false,
    isScrollDisabled = false,
    weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    weekdaysSingle = ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    targetEventRef,
    targetEventData,
    targetMoreRef,
    targetMoreData,
    actionRef,
    isDrawerApp,
    children,
    ...rest
}: Props) => {
    const attendeeBusySlots = useCalendarSelector(selectAttendeesBusySlots);
    const { getRangesAsLayoutEvents, getRangeAsCalendarViewEvents, isBookingActive } = useBookings();
    const containerRef = useRef<HTMLDivElement>(null);
    const timeGridRef = useRef<HTMLDivElement>(null);
    const dayGridRef = useRef<HTMLUListElement>(null);
    const nowRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const partDayEventViewRef = useRef<HTMLDivElement>(null);

    const { viewportWidth } = useActiveBreakpoint();

    const { previous: previousDay, next: nextDay } = getNavigationArrowsText(VIEWS.DAY);

    const canDisplaySecondaryTimeZone = displaySecondaryTimezone && !isDrawerApp;

    const rect = useElementRect(timeGridRef);
    const [partDayEventViewStyleValues, setPartDayEventViewStyleValues] = useState(() => ({
        padding: 0,
        lineHeight: 0,
    }));

    const days = useMemo(() => {
        return eachDayOfInterval(start, end);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-09C912
    }, [+start, +end]);

    const formattedHours = useMemo(() => {
        return hours.map(formatTime);
    }, [formatTime]);

    const formattedSecondaryHours = useMemo(() => {
        return hours.map((hourDate) => formatTime(new Date(hourDate.getTime() - secondaryTimezoneOffset)));
    }, [secondaryTimezoneOffset, formatTime]);

    const [timeEvents, dayEvents] = useMemo(() => {
        // Remove bookings from timedEvents because we are displaying it with rangesEvents
        const filteredEvents = events.filter((event) => !isBookingSlotEvent(event));
        const result = [...filteredEvents, ...attendeeBusySlots].reduce<
            [(CalendarViewEvent | CalendarViewBusyEvent)[], (CalendarViewEvent | CalendarViewBusyEvent)[]]
        >(
            (acc, event) => {
                if (!event.isAllDay) {
                    acc[0].push(event);
                }
                if (event.isAllDay) {
                    acc[1].push(event);
                }
                return acc;
            },
            [[], []]
        );

        // We need to have chronological ordering for the layout to be calculated correctly
        return [result[0].sort((dateA, dateB) => compareAsc(dateA.start, dateB.start)), result[1]];
    }, [events, attendeeBusySlots]);

    const daysRows = useMemo(() => {
        if (viewportWidth['<=small']) {
            return [[date]];
        }
        return [days];
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-1CD7F9
    }, [days, viewportWidth['<=small'], date]);

    // To prevent displaying both the temporary event, that is the range we're moving or resizing, and the old range,
    // we need to filter it out from the rangesPerDay and rangesEvents
    const temporaryBookingRange = events.find((event) => isBookingSlotEvent(event));
    const rangesPerDay = isBookingActive ? getRangesAsLayoutEvents(date, days, temporaryBookingRange) : {};
    const rangesEvents = isBookingActive ? getRangeAsCalendarViewEvents(date, temporaryBookingRange) : [];

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
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-4B263C
    }, [timeEvents, days, totalMinutes]);

    const nowTop = toUTCMinutes(now) / totalMinutes;
    const nowTopPercentage = toPercent(nowTop);

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

    const handleClickNextDay = useCallback(() => {
        onChangeDate?.(addDays(date, 1));
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-9DEF08
    }, [date]);

    const handleClickPrevDay = useCallback(() => {
        onChangeDate?.(addDays(date, -1));
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-A9436E
    }, [date]);

    useImperativeHandle(
        actionRef,
        () => ({
            scrollToTime,
            scrollToNow: () => {
                return scrollToTime(now);
            },
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-BE98E9
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
                events: dayEvents.filter((event): event is CalendarViewEvent => !isBusySlotEvent(event)),
                eventsPerRows,
                dayGridEl: dayGridRef.current,
            });
        }

        const normalizedDays = viewportWidth['<=small'] ? [date] : days;

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
            events: [...timeEvents, ...rangesEvents],
            // To observe user actions on the booking ranges, we need to merge rangesPerDay and eventsPerDay
            eventsPerDay: Object.entries(eventsPerDay).reduce(
                (acc, [key, value]) => {
                    acc[key] = [...(acc[key] ?? []), ...value];
                    return acc;
                },
                { ...rangesPerDay }
            ),
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

        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            // The shortest way we found to open the event popover using keyboard
            // is to click on the event.
            // We need to trigger a mousedown to launch the logic to open an event,
            // but since mousedown event is allowing to drag the event on the grid,
            // we need to trigger a mouseup event right after so that we only open the popover.
            if (!!target && (e.key === 'Enter' || e.key === ' ')) {
                const rect = target.getBoundingClientRect();
                // add a small offset to the click, otherwise when we search for the day container,
                // we detect the previous day. Then the event is not found in the container and not opened
                target.dispatchEvent(new MouseEvent('mousedown', { clientX: rect.left + 5, clientY: rect.top }));
                target.dispatchEvent(new MouseEvent('mouseup'));
            }
        };

        document.addEventListener('mousedown', handleMouseDown, true);

        // Add event listener on events so that we can open them using keyboard
        containerRef.current?.addEventListener('keydown', handleKeyDown, true);
        return () => {
            document.removeEventListener('mousedown', handleMouseDown, true);
            // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-4E352E
            containerRef.current?.removeEventListener('keydown', handleKeyDown, true);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-BC457E
    }, [!!isScrollDisabled, scrollRef.current]);

    useLayoutEffect(() => {
        actionRef.current?.scrollToNow();

        const partDayEventViewElement = partDayEventViewRef.current;
        if (partDayEventViewElement) {
            const computedStyle = window.getComputedStyle(partDayEventViewElement);
            setPartDayEventViewStyleValues({
                lineHeight: parseFloat(computedStyle.lineHeight),
                padding: parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom),
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-7CB702
    }, []);

    const dayButtons = (
        <DayButtons
            days={days}
            now={now}
            date={date}
            onClickDate={onClickDate}
            weekdays={weekdays}
            weekdaysSingle={weekdaysSingle}
            hasSmallLabels={isDrawerApp}
            hasBoldLabels={isDrawerApp}
        />
    );

    return (
        <div className="flex flex-column flex-nowrap w-full" ref={containerRef}>
            <div
                ref={titleRef}
                className={clsx(['calendar-row-heading shrink-0 shadow-norm bg-norm', displayViewClass])}
            >
                <div
                    data-testid="calendar-day-week-view:week-header"
                    className={clsx('flex', isDrawerApp ? 'border-bottom border-weak' : 'calendar-first-row-heading')}
                >
                    {canDisplaySecondaryTimeZone ? <div className="calendar-aside" /> : null}
                    {!isDrawerApp && <div className="calendar-aside" />}

                    {isDrawerApp ? (
                        <div className="ml-4 mr-2 my-2 flex items-end justify-space-between w-full">
                            <ButtonGroup size="small" color="weak" shape="outline">
                                <Tooltip title={previousDay}>
                                    <Button icon onClick={handleClickPrevDay}>
                                        <IcChevronLeft alt={previousDay} />
                                    </Button>
                                </Tooltip>
                                <Tooltip title={nextDay}>
                                    <Button icon onClick={handleClickNextDay}>
                                        <IcChevronRight alt={nextDay} />
                                    </Button>
                                </Tooltip>
                            </ButtonGroup>
                            <Tooltip title={format(now, 'PP', { locale: dateLocale })}>
                                <Button onClick={onClickToday} size="small" aria-pressed={isSameDay(date, now)}>{c(
                                    'Action'
                                ).t`Today`}</Button>
                            </Tooltip>
                        </div>
                    ) : (
                        dayButtons
                    )}
                </div>

                <div className="flex calendar-fullday-row">
                    {canDisplaySecondaryTimeZone && !isDrawerApp ? (
                        <div className="calendar-aside text-center flex flex-column justify-end">
                            <div className="calendar-secondary-timezone-cell calendar-secondary-timezone-cell--header">
                                {secondaryTimezone}
                            </div>
                        </div>
                    ) : null}
                    <div className="calendar-aside text-center flex flex-column justify-end">
                        {isDrawerApp ? (
                            <span
                                className="h-custom flex flex-column justify-center pt-1"
                                style={{ '--h-custom': `${dayEventHeight / 16}rem` }}
                            >
                                {primaryTimezone}
                            </span>
                        ) : (
                            <div className="calendar-primary-timezone-cell calendar-primary-timezone-cell--header text-center">
                                {primaryTimezone}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 relative">
                        <ul
                            className="calendar-time-fullday h-custom unstyled m-0"
                            style={{ '--h-custom': `${(actualRows * dayEventHeight) / 16}rem` }}
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
                        </ul>
                    </div>
                </div>
            </div>
            <div
                className={clsx(['flex-1 overflow-auto h-full calendar-time-grid', displayViewClass])}
                tabIndex={-1}
                ref={scrollRef}
                {...rest}
            >
                {children}

                <div className={clsx('relative main-area-content', !isDrawerApp && 'border-right border-weak')}>
                    <div className="flex">
                        {canDisplaySecondaryTimeZone ? (
                            <HourTexts
                                className="calendar-aside calendar-secondary-timezone-cell"
                                hours={formattedSecondaryHours}
                            />
                        ) : null}
                        <HourTexts className="calendar-aside calendar-primary-timezone-cell" hours={formattedHours} />
                        <div className="flex flex-1 relative calendar-grid-gridcells" ref={timeGridRef}>
                            <HourLines hours={hours} />
                            {days.map((day, dayIndex) => {
                                const key = getKey(day);
                                const isActiveDay = isSameDay(day, date);
                                const dayFullDetail = formatUTC(day, 'PPPP', { locale: dateLocale });
                                if (viewportWidth['<=small'] && !isActiveDay) {
                                    return null;
                                }
                                return (
                                    // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
                                    <div
                                        data-testid="calendar-week-day-view:weekday-column"
                                        className="flex-1 relative calendar-grid-gridcell h-full"
                                        key={key}
                                        aria-label={dayFullDetail}
                                        role="region"
                                    >
                                        <DayEvents
                                            tzid={tzid}
                                            events={[...timeEvents, ...rangesEvents]}
                                            eventsInDay={eventsPerDay[key] || []}
                                            dayIndex={viewportWidth['<=small'] ? 0 : dayIndex}
                                            totalMinutes={totalMinutes}
                                            targetEventData={targetEventData}
                                            targetEventRef={targetEventRef}
                                            formatTime={formatTime}
                                            now={now}
                                            colHeight={rect?.height}
                                            partDayEventViewStyleValues={partDayEventViewStyleValues}
                                            rangeInDay={rangesPerDay[key] || []}
                                        />
                                        {isSameDay(day, now) ? (
                                            <div
                                                className="calendar-grid-nowHourLine absolute top-custom"
                                                ref={nowRef}
                                                style={{ '--top-custom': nowTopPercentage }}
                                            />
                                        ) : null}
                                    </div>
                                );
                            })}
                            {/* Renders the part day event view to get CSS values  */}
                            <PartDayEventView className="isHidden" ref={partDayEventViewRef} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimeGrid;
