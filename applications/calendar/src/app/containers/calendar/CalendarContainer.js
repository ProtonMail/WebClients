import React, { useMemo, useState, useEffect, useReducer, useCallback, useRef } from 'react';
import { useModals, useCalendars, useCalendarUserSettings, useCalendarBootstrap } from 'react-components';
import {
    convertUTCDateTimeToZone,
    convertZonedDateTimeToUTC,
    fromUTCDate,
    toUTCDate,
    getTimezone
} from 'proton-shared/lib/date/timezone';
import { c } from 'ttag';
import { getFormattedWeekdays, isDateYYMMDDEqual } from 'proton-shared/lib/date/date';
import { format } from 'proton-shared/lib/date-fns-utc';
import { dateLocale } from 'proton-shared/lib/i18n';
import { VIEWS, SETTINGS_VIEW } from '../../constants';
import CreateEventModal from '../../components/eventModal/CreateEventModal';
import useCalendarsEvents from './useCalendarsEvents';
import { getDateRange } from './helper';
import TimeGrid from '../../components/calendar/TimeGrid';
import DayGrid from '../../components/calendar/DayGrid';
import YearView from '../../components/YearView';
import AgendaView from '../../components/AgendaView';
import FullDayEvent from '../../components/events/FullDayEvent';
import PartDayEvent from '../../components/events/PartDayEvent';
import PopoverEvent from '../../components/events/PopoverEvent';
import MorePopoverEvent from '../../components/events/MorePopoverEvent';
import MoreFullDayEvent from '../../components/events/MoreFullDayEvent';
import CalendarContainerView from './CalendarContainerView';

const { DAY, WEEK, MONTH, YEAR, AGENDA } = VIEWS;

const URL_PARAMS_VIEWS_CONVERSION = {
    //'year': YEAR,
    month: MONTH,
    week: WEEK,
    day: DAY
};
const VIEW_URL_PARAMS_VIEWS_CONVERSION = {
    //'year': YEAR,
    [MONTH]: 'month',
    [WEEK]: 'week',
    [DAY]: 'day'
};

const SETTINGS_VIEW_CONVERSION = {
    //[SETTINGS_VIEW.YEAR]: YEAR,
    [SETTINGS_VIEW.MONTH]: MONTH,
    [SETTINGS_VIEW.WEEK]: WEEK,
    [SETTINGS_VIEW.DAY]: DAY
};

const SUPPORTED_VIEWS = [MONTH, WEEK, DAY];

const getDefaultView = ({ ViewPreference } = {}) => {
    return SETTINGS_VIEW_CONVERSION[ViewPreference] || WEEK;
};

const getUrlView = (urlView) => {
    if (urlView && URL_PARAMS_VIEWS_CONVERSION[urlView]) {
        return URL_PARAMS_VIEWS_CONVERSION[urlView];
    }
};

const getUrlDate = (urlYear, urlMonth, urlDay) => {
    const year = parseInt(urlYear, 10);
    const month = parseInt(urlMonth, 10);
    const day = parseInt(urlDay, 10);
    if (year >= 0 && year < 9999 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return new Date(Date.UTC(year, month - 1, day));
    }
};

const getRange = (view, range) => {
    if (!range) {
        return;
    }
    const max = Math.max(Math.min(range, 6), 1);
    if (view === WEEK) {
        return max;
    }
    return Math.min(max, 4);
};

const getWeekStartsOn = ({ WeekStart = 0 } = {}) => {
    // Sunday should be 0, not 7
    return WeekStart % 7;
};

const getDisplayWeekNumbers = ({ DisplayWeekNumber } = {}) => {
    return !!DisplayWeekNumber;
};

export const getTzid = ({ AutoDetectPrimaryTimezone, PrimaryTimezone } = {}, defaultTimezone) => {
    if (AutoDetectPrimaryTimezone) {
        return defaultTimezone;
    }
    if (PrimaryTimezone) {
        return PrimaryTimezone;
    }
    return defaultTimezone;
};

const fromUrlParams = (pathname) => {
    const [, , ...rest] = pathname.split('/');
    return {
        view: getUrlView(rest[0]),
        range: parseInt(rest[4], 10) || undefined,
        date: getUrlDate(rest[1], rest[2], rest[3])
    };
};

const toUrlParams = ({ date, defaultDate, view, defaultView, range }) => {
    const dateParams =
        !range && isDateYYMMDDEqual(date, defaultDate)
            ? undefined
            : [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()];
    const viewParam = !dateParams && view === defaultView ? undefined : VIEW_URL_PARAMS_VIEWS_CONVERSION[view];
    const result = [viewParam, ...(dateParams || []), range];
    return ['/calendar', ...result].filter(Boolean).join('/');
};

const customReducer = (oldState, newState) => {
    const keys = Object.keys(newState);
    for (const key of keys) {
        // If there is a difference in any of the keys, return a new object.
        if (oldState[key] !== newState[key]) {
            return {
                ...oldState,
                ...newState
            };
        }
    }
    // Otherwise return the old state to prevent a re-render
    return oldState;
};

const components = {
    FullDayEvent,
    PartDayEvent,
    PopoverEvent,
    MorePopoverEvent,
    MoreFullDayEvent
};

const CalendarContainer = ({ history, location }) => {
    const [calendars, loadingCalendars] = useCalendars();
    const [calendarSettings, loadingCalendarSettings] = useCalendarUserSettings();

    const visibleCalendars = useMemo(() => {
        return calendars ? calendars.filter(({ Display }) => !!Display) : undefined;
    }, [calendars]);

    const [nowDate, setNowDate] = useState(() => new Date());

    const timeGridViewRef = useRef();

    useEffect(() => {
        const handle = setInterval(() => setNowDate(new Date()), 30000);
        return () => {
            clearInterval(handle);
        };
    }, []);

    useEffect(() => {
        document.title = 'ProtonCalendar';
    }, []);

    const { view: urlView, range: urlRange, date: urlDate } = useMemo(() => fromUrlParams(location.pathname), [
        location.pathname
    ]);

    // In the same to get around setStates not being batched in the range selector callback.
    const [{ view: customView, range: customRange, date: customUtcDate }, setCustom] = useReducer(
        customReducer,
        undefined,
        () => {
            return { view: urlView, range: urlRange, date: urlDate };
        }
    );

    useEffect(() => {
        // We only care about new dates in the URL when the browser moves back or forward, not from push states coming from the app.
        if (history.action === 'POP') {
            setCustom({ view: urlView, range: urlRange, date: urlDate });
        }
    }, [urlDate, urlView, urlRange]);

    const [localTzid] = useState(() => getTimezone());
    const [customTzid, setCustomTzid] = useState();
    const tzid = customTzid || getTzid(calendarSettings, localTzid);

    const utcNowDateInTimezone = useMemo(() => {
        return toUTCDate(convertUTCDateTimeToZone(fromUTCDate(nowDate), tzid));
    }, [nowDate, tzid]);

    const utcDefaultDate = useMemo(() => {
        return new Date(
            Date.UTC(
                utcNowDateInTimezone.getUTCFullYear(),
                utcNowDateInTimezone.getUTCMonth(),
                utcNowDateInTimezone.getUTCDate()
            )
        );
    }, [utcNowDateInTimezone]);

    const utcDate = customUtcDate || utcDefaultDate;

    const defaultView = getDefaultView(calendarSettings);
    const requestedView = customView || defaultView;
    const view = SUPPORTED_VIEWS.includes(requestedView) ? requestedView : WEEK;

    const range = getRange(view, customRange);
    const weekStartsOn = getWeekStartsOn(calendarSettings);
    const displayWeekNumbers = getDisplayWeekNumbers(calendarSettings);

    useEffect(() => {
        const newRoute = toUrlParams({ date: utcDate, defaultDate: utcDefaultDate, view, defaultView, range });
        if (location.pathname === newRoute) {
            return;
        }
        history.push(newRoute);
        // Intentionally not listening to everything to only trigger URL updates when these variables change.
    }, [view, range, utcDate]);

    const utcDateRange = useMemo(() => {
        return getDateRange(utcDate, range, view, weekStartsOn);
    }, [view, utcDate, weekStartsOn, range]);

    const utcDateRangeInTimezone = useMemo(
        () => [
            toUTCDate(convertZonedDateTimeToUTC(fromUTCDate(utcDateRange[0]), tzid)),
            toUTCDate(convertZonedDateTimeToUTC(fromUTCDate(utcDateRange[1]), tzid))
        ],
        [utcDateRange, tzid]
    );

    const [calendarsEvents, loadingEvents] = useCalendarsEvents(visibleCalendars, utcDateRangeInTimezone, tzid);

    const { createModal } = useModals();

    const setDateAndView = useCallback((newDate, newView) => {
        setCustom({ view: newView, range: undefined, date: newDate });
    }, []);

    const scrollToNow = useCallback(() => {
        setTimeout(() => {
            if (timeGridViewRef.current) {
                timeGridViewRef.current.scrollToNow();
            }
        }, 10);
    }, []);

    const handleChangeView = useCallback((newView) => {
        setCustom({ view: newView, range: undefined });
        scrollToNow();
    }, []);

    const handleClickToday = useCallback(() => {
        setCustom({ date: utcDefaultDate });
        scrollToNow();
    }, []);

    const handleClickDateWeekView = useCallback((newDate) => {
        setDateAndView(newDate, DAY);
    }, []);

    const handleClickDateYearView = useCallback((newDate) => {
        setDateAndView(newDate, WEEK);
    }, []);

    const handleClickDateAgendaView = useCallback((newDate) => {
        setDateAndView(newDate, WEEK);
    }, []);

    const handleEventModal = useCallback(
        ({ Event, start, end, isAllDay, type, title, calendarID, onClose } = {}) => {
            if (!calendars || !calendars.length) {
                return;
            }
            createModal(
                <CreateEventModal
                    Event={Event}
                    start={start}
                    end={end}
                    isAllDay={isAllDay}
                    type={type}
                    title={title}
                    calendars={calendars}
                    calendarID={calendarID || calendars[0].ID}
                    displayWeekNumbers={displayWeekNumbers}
                    weekStartsOn={weekStartsOn}
                    tzid={tzid}
                    onClose={onClose}
                />
            );
        },
        [calendars, tzid, weekStartsOn, displayWeekNumbers]
    );

    const defaultCalendar = calendars[0];
    const [
        { CalendarSettings: { DefaultEventDuration: defaultEventDuration = 30 } = {} } = {},
        loadingCalendarBootstrap
    ] = useCalendarBootstrap(defaultCalendar ? defaultCalendar.ID : undefined);

    const defaultEventData = useMemo(() => {
        return {
            Calendar: defaultCalendar
        };
    }, [defaultCalendar]);

    const isLoading = loadingCalendarBootstrap || loadingCalendars || loadingCalendarSettings || loadingEvents;

    const formatDate = useCallback((utcDate) => {
        return format(utcDate, 'PP', { locale: dateLocale });
    }, []);
    const formatEventTime = useCallback((utcDate) => {
        return format(utcDate, 'p', { locale: dateLocale });
    }, []);

    const weekdaysLong = useMemo(() => {
        return getFormattedWeekdays('cccc', { locale: dateLocale });
    }, [dateLocale]);

    const week = c('Label').t`Week`;

    return (
        <CalendarContainerView
            calendars={calendars}
            isLoading={isLoading}
            displayWeekNumbers={displayWeekNumbers}
            weekStartsOn={weekStartsOn}
            tzid={tzid}
            setTzid={setCustomTzid}
            range={range}
            setCustom={setCustom}
            view={view}
            utcDefaultDate={utcDefaultDate}
            utcDate={utcDate}
            utcDateRange={utcDateRange}
            onCreateEvent={handleEventModal}
            onClickToday={handleClickToday}
            onChangeView={handleChangeView}
        >
            {(() => {
                if (view === DAY || view === WEEK) {
                    return (
                        <TimeGrid
                            tzid={tzid}
                            displayWeekNumbers={displayWeekNumbers}
                            now={utcNowDateInTimezone}
                            date={utcDate}
                            dateRange={utcDateRange}
                            events={calendarsEvents}
                            formatTime={formatEventTime}
                            onClickDate={handleClickDateWeekView}
                            onEditEvent={handleEventModal}
                            components={components}
                            isInteractionEnabled={!isLoading}
                            ref={timeGridViewRef}
                            defaultEventDuration={defaultEventDuration}
                            defaultEventData={defaultEventData}
                            week={week}
                            weekDaysLong={weekdaysLong}
                        />
                    );
                }
                if (view === MONTH) {
                    return (
                        <DayGrid
                            tzid={tzid}
                            displayWeekNumbers={displayWeekNumbers}
                            date={utcDate}
                            dateRange={utcDateRange}
                            now={utcNowDateInTimezone}
                            events={calendarsEvents}
                            formatTime={formatEventTime}
                            formatDate={formatDate}
                            defaultEventData={defaultEventData}
                            isInteractionEnabled={!isLoading}
                            onClickDate={handleClickDateWeekView}
                            onEditEvent={handleEventModal}
                            components={components}
                            weekDaysLong={weekdaysLong}
                        />
                    );
                }
                if (view === YEAR) {
                    return (
                        <YearView
                            tzid={tzid}
                            calendarIDs={visibleCalendars.map(({ ID }) => ID)}
                            displayWeekNumbers={displayWeekNumbers}
                            currentDate={utcDate}
                            onSelectDate={handleClickDateYearView}
                        />
                    );
                }
                if (view === AGENDA) {
                    return (
                        <AgendaView
                            events={calendarsEvents}
                            currentDate={utcDate}
                            dateRange={utcDateRange}
                            onSelectDate={handleClickDateAgendaView}
                        />
                    );
                }
            })()}
        </CalendarContainerView>
    );
};

export default CalendarContainer;
