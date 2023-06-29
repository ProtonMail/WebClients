import {
    ComponentPropsWithoutRef,
    ReactNode,
    Ref,
    RefObject,
    useCallback,
    useEffect,
    useImperativeHandle,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ButtonGroup, Icon, Tooltip, useElementRect } from '@proton/components';
import { VIEWS } from '@proton/shared/lib/calendar/constants';
import { addDays, eachDayOfInterval, format, isSameDay } from '@proton/shared/lib/date-fns-utc';
import { dateLocale } from '@proton/shared/lib/i18n';
import clsx from '@proton/utils/clsx';

import { CalendarViewEvent, TargetEventData, TargetMoreData } from '../../containers/calendar/interface';
import { getNavigationArrowsText } from '../../helpers/i18n';
import { PartDayEventView } from '../events/PartDayEvent';
import RowEvents from './DayGrid/RowEvents';
import DayButtons from './TimeGrid/DayButtons';
import DayEvents from './TimeGrid/DayEvents';
import DayLines from './TimeGrid/DayLines';
import HourLines from './TimeGrid/HourLines';
import HourTexts from './TimeGrid/HourTexts';
import handleDayGridMouseDown from './interactions/dayGridMouseHandler';
import { OnMouseDown } from './interactions/interface';
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
    onChangeDate?: (date: Date) => void;
    onClickToday?: () => void;
    weekdays?: string[];
    weekdaysSingle?: string[];
    actionRef: RefObject<TimeGridActionRef>;
    isDrawerApp?: boolean;
    children?: ReactNode; // Needed for the dropzone
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
    const timeGridRef = useRef<HTMLDivElement>(null);
    const dayGridRef = useRef<HTMLDivElement>(null);
    const nowRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const partDayEventViewRef = useRef<HTMLDivElement>(null);

    const { previous: previousDay, next: nextDay } = getNavigationArrowsText(VIEWS.DAY);

    const canDisplaySecondaryTimeZone = displaySecondaryTimezone && !isDrawerApp;

    const rect = useElementRect(timeGridRef);
    const [partDayEventViewStyleValues, setPartDayEventViewStyleValues] = useState(() => ({
        padding: 0,
        lineHeight: 0,
    }));

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

    const handleClickNextDay = useCallback(() => {
        onChangeDate?.(addDays(date, 1));
    }, [date]);

    const handleClickPrevDay = useCallback(() => {
        onChangeDate?.(addDays(date, -1));
    }, [date]);

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

        const partDayEventViewElement = partDayEventViewRef.current;
        if (partDayEventViewElement) {
            const computedStyle = window.getComputedStyle(partDayEventViewElement);
            setPartDayEventViewStyleValues({
                lineHeight: parseFloat(computedStyle.lineHeight),
                padding: parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom),
            });
        }
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
        <div
            className={clsx(['flex-item-fluid scroll-if-needed h100', displayViewClass])}
            onScroll={handleScroll}
            ref={scrollRef}
            {...rest}
        >
            {children}
            <div className="relative main-area-content">
                <div
                    ref={titleRef}
                    className={clsx([
                        'sticky-title sticky-title--no-padding on-mobile-remain-sticky',
                        !scrollTop && 'sticky-title--on-top',
                    ])}
                >
                    <div data-testid="calendar-day-week-view:week-header" className="flex calendar-first-row-heading">
                        {canDisplaySecondaryTimeZone ? (
                            <div className="calendar-aside text-center flex flex-column flex-justify-end">
                                <div className="calendar-secondary-timezone-cell calendar-secondary-timezone-cell--header">
                                    {secondaryTimezone}
                                </div>
                            </div>
                        ) : null}
                        {!isDrawerApp && (
                            <div className="calendar-aside flex flex-column flex-justify-end">
                                <div className="text-center">{primaryTimezone}</div>
                            </div>
                        )}

                        {isDrawerApp ? (
                            <div className="ml-4 mr-2 mb-2 flex flex-align-items-end flex-justify-space-between w100">
                                <ButtonGroup size="small" color="weak" shape="outline">
                                    <Tooltip title={previousDay}>
                                        <Button icon onClick={handleClickPrevDay}>
                                            <Icon name="chevron-left" alt={previousDay} />
                                        </Button>
                                    </Tooltip>
                                    <Tooltip title={nextDay}>
                                        <Button icon onClick={handleClickNextDay}>
                                            <Icon name="chevron-right" alt={nextDay} />
                                        </Button>
                                    </Tooltip>
                                </ButtonGroup>
                                <Tooltip title={format(now, 'PP', { locale: dateLocale })}>
                                    <Button onClick={onClickToday} size="small">{c('Action').t`Today`}</Button>
                                </Tooltip>
                            </div>
                        ) : (
                            dayButtons
                        )}
                    </div>

                    <div className="flex calendar-fullday-row">
                        {canDisplaySecondaryTimeZone ? <div className="calendar-aside" /> : null}
                        <div className="calendar-aside calendar-aside-weekNumber text-center flex flex-column flex-justify-end">
                            {isDrawerApp && (
                                <span
                                    className="h-custom flex flex-column flex-justify-center pt-1"
                                    style={{ '--h-custom': `${dayEventHeight / 16}rem` }}
                                >
                                    {primaryTimezone}
                                </span>
                            )}
                        </div>
                        <div className="flex-item-fluid relative">
                            <DayLines days={daysRows[0]} />
                            <div
                                className="calendar-time-fullday h-custom"
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
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex">
                    {canDisplaySecondaryTimeZone ? (
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
                                    data-testid="calendar-week-day-view:weekday-column"
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
                                        colHeight={rect?.height}
                                        partDayEventViewStyleValues={partDayEventViewStyleValues}
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
    );
};

export default TimeGrid;
