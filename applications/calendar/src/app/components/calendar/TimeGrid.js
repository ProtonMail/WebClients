import React, {
    createElement,
    useMemo,
    useRef,
    useState,
    useCallback,
    useImperativeHandle,
    useLayoutEffect
} from 'react';
import { eachDayOfInterval, format } from 'proton-shared/lib/date-fns-utc';
import PropTypes from 'prop-types';
import { useWindowSize, classnames } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';
import { isDateYYMMDDEqual } from 'proton-shared/lib/date/date';

import { sortWithTemporaryEvent } from './layout';
import useTimeGridMouseHandler from './useTimeGridMouseHandler';
import useTimeGridEventLayout from './useTimeGridEventLayout';
import useDayGridEventLayout from './useDayGridEventLayout';
import { getKey, toUTCMinutes } from './splitTimeGridEventsPerDay';
import useDayGridMouseHandler from './useDayGridMouseHandler';
import usePopoverEvent from './usePopoverEvent';
import useMore from './useMore';
import { getEvent, isMoreSelected } from './DayGrid';
import { toPercent } from './mouseHelpers/mathHelpers';

const hours = Array.from({ length: 24 }, (a, i) => {
    return new Date(Date.UTC(2000, 0, 1, i));
});

const totalMinutes = 24 * 60;

const defaultFormat = (utcDate) => format(utcDate, 'p');

const TimeGrid = React.forwardRef(
    (
        {
            now,
            tzid,
            date,
            dateRange: [start, end],
            events = [],
            components: { FullDayEvent, PartDayEvent, PopoverEvent, MorePopoverEvent, MoreFullDayEvent },
            formatTime = defaultFormat,
            onClickDate = noop,
            onEditEvent = noop,
            defaultEventDuration = 30,
            defaultEventData,
            isInteractionEnabled = false,
            weekdaysLong = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        },
        ref
    ) => {
        const timeGridRef = useRef();
        const mainRef = useRef();
        const nowRef = useRef();
        const titleRef = useRef();
        const scrollRef = useRef();
        const [windowWidth, windowHeight] = useWindowSize();

        const [scrollTop, setScrollTop] = useState();

        const days = useMemo(() => {
            return eachDayOfInterval(start, end);
        }, [+start, +end]);

        const [temporaryEvent, setTemporaryEvent] = useState();
        const [selectedEventID, setSelectedEventID] = useState();
        const [moreDateIdx, setMoreDateIdx] = useState();

        const sortedEvents = useMemo(() => {
            return sortWithTemporaryEvent(events, temporaryEvent);
        }, [temporaryEvent, events]);

        const formattedHours = useMemo(() => {
            return hours.map(formatTime);
        }, [formatTime]);

        const timeEvents = useMemo(() => sortedEvents.filter((e) => !e.isAllDay), [sortedEvents]);
        const dayEvents = useMemo(() => sortedEvents.filter((e) => !!e.isAllDay), [sortedEvents]);
        const daysRows = useMemo(() => [days], [days]);

        const dayEventHeight = 24;
        const numberOfRows = 3;

        const eventsPerRows = useDayGridEventLayout(daysRows, dayEvents, numberOfRows, dayEventHeight);

        const [{ eventsInRow, eventsInRowStyles, maxRows, eventsInRowSummary }] = eventsPerRows;
        const actualRows = Math.max(Math.min(maxRows, numberOfRows + 1), 1);

        const [eventsPerDay, eventsLaidOut] = useTimeGridEventLayout(timeEvents, days, totalMinutes);

        const onDayGridMouseDown = useDayGridMouseHandler({
            isInteractionEnabled,
            setTemporaryEvent,
            setSelectedEventID,
            setMoreDateIdx,
            defaultEventData,
            events: dayEvents,
            eventsPerRows,
            rows: daysRows
        });

        const onTimeGridMouseDown = useTimeGridMouseHandler({
            totalDays: days.length,
            totalMinutes,
            interval: 30,
            defaultEventDuration,
            defaultEventData,
            setTemporaryEvent,
            setSelectedEventID,
            events: timeEvents,
            eventsPerDay,
            days
        });

        const nowTop = toUTCMinutes(now) / totalMinutes;
        const nowTopPercentage = toPercent(nowTop);

        const selectedEventRef = useRef();
        const selectedEvent = useMemo(() => {
            return sortedEvents.find(({ id }) => id === selectedEventID);
        }, [selectedEventID, sortedEvents]);

        const [popoverStyle, popoverLayout] = usePopoverEvent(
            selectedEvent,
            selectedEventRef,
            mainRef,
            days,
            windowWidth,
            windowHeight
        );
        let isFirstSelection = true;

        const selectedMoreRef = useRef();
        const [selectedMoreData, moreRow, moreIdx] = useMore(moreDateIdx, eventsPerRows, dayEvents);
        const selectedMoreDate =
            typeof moreRow !== 'undefined' && typeof moreIdx !== 'undefined' ? days[moreIdx] : undefined;
        const [morePopoverStyle, morePopoverLayout] = usePopoverEvent(
            selectedMoreData,
            selectedMoreRef,
            mainRef,
            days,
            windowWidth,
            windowHeight
        );

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

        useLayoutEffect(() => {
            ref.current.scrollToNow();
        }, []);

        return (
            <div
                className="flex-item-fluid scroll-if-needed view-column-detail"
                onScroll={handleScroll}
                ref={scrollRef}
            >
                <div className="relative main-area-content" ref={mainRef}>
                    <div
                        ref={titleRef}
                        className={classnames([
                            'sticky-title sticky-title--noPadding',
                            !scrollTop && 'sticky-title--onTop'
                        ])}
                    >
                        <div className="flex">
                            <div className="calendar-aside aligncenter"></div>
                            {days.map((day) => {
                                return (
                                    <button
                                        className="flex-item-fluid aligncenter calendar-grid-heading p0-5"
                                        type="button"
                                        key={day.getUTCDate()}
                                        aria-current={isDateYYMMDDEqual(day, now) ? 'date' : undefined}
                                        aria-pressed={isDateYYMMDDEqual(day, date) ? true : undefined}
                                        onClick={() => onClickDate(day)}
                                    >
                                        <span className="calendar-grid-heading-number mt0-25">
                                            <span className="mauto">{day.getUTCDate()}</span>
                                        </span>
                                        <span className="calendar-grid-heading-day ellipsis bl mt0 mb0 big">
                                            {weekdaysLong[day.getUTCDay()]}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex calendar-fullday-row">
                            <div className="calendar-aside calendar-aside-weekNumber flex"></div>
                            <div className="flex-item-fluid relative">
                                <div className="flex">
                                    {days.map((day) => {
                                        return (
                                            <div
                                                className="calendar-grid-dayLine flex-item-fluid"
                                                key={day.getUTCDate()}
                                            />
                                        );
                                    })}
                                </div>
                                <div
                                    className="calendar-time-fullday"
                                    style={{ height: actualRows * dayEventHeight + 'px' }}
                                    data-row="0"
                                    onMouseDownCapture={isInteractionEnabled ? onDayGridMouseDown : undefined}
                                >
                                    {eventsInRowStyles.map(({ idx, type, style }) => {
                                        if (type === 'more') {
                                            const isSelected = isMoreSelected(idx, moreIdx, 0, moreRow);
                                            const eventRef = isSelected ? selectedMoreRef : undefined;
                                            return createElement(MoreFullDayEvent, {
                                                key: `more${idx}`,
                                                style,
                                                more: eventsInRowSummary[idx].more,
                                                eventRef,
                                                isSelected
                                            });
                                        }

                                        const event = getEvent(idx, eventsInRow, dayEvents);
                                        const isSelected = event.id === selectedEventID;
                                        const isBeforeNow = now > event.end && !isDateYYMMDDEqual(now, event.end);
                                        const eventRef = isSelected && isFirstSelection ? selectedEventRef : undefined;
                                        if (eventRef) {
                                            isFirstSelection = false;
                                        }
                                        return createElement(FullDayEvent, {
                                            event,
                                            style,
                                            key: event.id,
                                            eventRef,
                                            formatTime,
                                            isSelected,
                                            isBeforeNow
                                        });
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex">
                        <div className="calendar-aside">
                            {hours.map((hour, i) => {
                                return (
                                    <div className="calendar-grid-timeBlock" key={i}>
                                        {i === 0 ? null : (
                                            <span className="calendar-grid-timeText aligncenter bl relative">
                                                {formattedHours[i]}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div
                            className="flex flex-item-fluid relative calendar-grid-gridcells"
                            onMouseDownCapture={isInteractionEnabled ? onTimeGridMouseDown : undefined}
                            ref={timeGridRef}
                        >
                            <div className="calendar-grid-hours">
                                {hours.map((hour) => {
                                    return <div className="calendar-grid-hourLine" key={hour.getUTCHours()} />;
                                })}
                            </div>

                            {days.map((day) => {
                                const key = getKey(day);
                                return (
                                    <div className="flex-item-fluid relative calendar-grid-gridcell h100" key={key}>
                                        {Array.isArray(eventsPerDay[key]) &&
                                            eventsPerDay[key].map((eventTimeDay, i) => {
                                                const { idx } = eventTimeDay;
                                                const event = timeEvents[idx];
                                                const style = eventsLaidOut[key][i];
                                                const isSelected = event.id === selectedEventID;
                                                const isBeforeNow = now > event.end;
                                                const eventRef =
                                                    isSelected && isFirstSelection ? selectedEventRef : undefined;
                                                if (eventRef) {
                                                    isFirstSelection = false;
                                                }
                                                return createElement(PartDayEvent, {
                                                    event,
                                                    style,
                                                    key: event.id,
                                                    formatTime,
                                                    eventRef,
                                                    isSelected,
                                                    isBeforeNow
                                                });
                                            })}
                                        {isDateYYMMDDEqual(day, now) ? (
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
                    {morePopoverStyle &&
                        selectedMoreData &&
                        createElement(MorePopoverEvent, {
                            events: selectedMoreData,
                            style: morePopoverStyle,
                            layout: morePopoverLayout,
                            eventRef: selectedEventRef,
                            selectedEventID,
                            setSelectedEventID: (id) => {
                                setSelectedEventID(id);
                                setTemporaryEvent();
                            },
                            selectedMoreDate,
                            formatTime,
                            onClose: () => setMoreDateIdx()
                        })}
                    {popoverStyle &&
                        selectedEvent &&
                        createElement(PopoverEvent, {
                            event: selectedEvent,
                            style: popoverStyle,
                            layout: popoverLayout,
                            tzid,
                            formatTime,
                            onClose: () => {
                                setSelectedEventID();
                                setTemporaryEvent();
                            },
                            onEditEvent
                        })}
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
