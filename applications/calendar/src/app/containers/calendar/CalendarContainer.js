import React, { useMemo, useState, useEffect, useReducer, useCallback, useRef } from 'react';
import { useCalendarUserSettings, useCalendarBootstrap, useAddresses } from 'react-components';
import {
    convertUTCDateTimeToZone,
    convertZonedDateTimeToUTC,
    fromUTCDate,
    toUTCDate,
    getTimezone,
    formatTimezoneOffset,
    getTimezoneOffset
} from 'proton-shared/lib/date/timezone';
import { isSameDay, MILLISECONDS_IN_MINUTE } from 'proton-shared/lib/date-fns-utc';
import { VIEWS, SETTINGS_VIEW } from '../../constants';
import useCalendarsEvents from './useCalendarsEvents';
import { getDateRange } from './helper';
import CalendarContainerView from './CalendarContainerView';
import InteractiveCalendarView from './InteractiveCalendarView';
import AlarmContainer from '../alarms/AlarmContainer';
//import { hasBit } from 'proton-shared/lib/helpers/bitset';
//import { CALENDAR_STATUS } from 'proton-shared/lib/calendar/constants';

const { DAY, WEEK, MONTH } = VIEWS;

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

const getDisplaySecondaryTimezone = ({ DisplaySecondaryTimezone } = {}) => {
    return !!DisplaySecondaryTimezone;
};

const getSecondaryTimezone = ({ SecondaryTimezone } = {}) => {
    return SecondaryTimezone;
};

const getDisplayWeekNumbers = ({ DisplayWeekNumber } = {}) => {
    return !!DisplayWeekNumber;
};

const formatAbbreviation = (abbreviation, offset) => {
    return `GMT${formatTimezoneOffset(offset)}`;
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
        !range && isSameDay(date, defaultDate)
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

const CalendarContainer = ({ calendars, history, location }) => {
    const [calendarSettings, loadingCalendarSettings] = useCalendarUserSettings();
    const [addresses, loadingAddresses] = useAddresses();
    const [disableCreate, setDisableCreate] = useState(false);

    const interactiveRef = useRef();

    const visibleCalendars = useMemo(() => {
        return calendars
            ? //? calendars.filter(({ Display, Status }) => !!Display && hasBit(Status, CALENDAR_STATUS.ACTIVE))
              calendars.filter(({ Display }) => !!Display)
            : undefined;
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
    const displaySecondaryTimezone = getDisplaySecondaryTimezone(calendarSettings);
    const secondaryTzid = getSecondaryTimezone(calendarSettings);

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

    const timezoneInformation = useMemo(() => {
        const [startDate] = utcDateRangeInTimezone;
        const { abbreviation, offset } = getTimezoneOffset(startDate, tzid);
        const { abbreviation: secondaryAbbreviaton, offset: secondaryOffset } = getTimezoneOffset(
            startDate,
            secondaryTzid || tzid
        );
        return {
            primaryTimezone: `${formatAbbreviation(abbreviation, offset)}`,
            secondaryTimezone: `${formatAbbreviation(secondaryAbbreviaton, secondaryOffset)}`,
            secondaryTimezoneOffset: (secondaryOffset - offset) * MILLISECONDS_IN_MINUTE
        };
    }, [utcDateRangeInTimezone, secondaryTzid, tzid]);

    useEffect(() => {
        const newRoute = toUrlParams({ date: utcDate, defaultDate: utcDefaultDate, view, defaultView, range });
        if (location.pathname === newRoute) {
            return;
        }
        history.push({ pathname: newRoute });
        // Intentionally not listening to everything to only trigger URL updates when these variables change.
    }, [view, range, utcDate]);

    const [calendarsEvents, loadingEvents] = useCalendarsEvents(visibleCalendars, utcDateRangeInTimezone, tzid);

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

    const handleChangeDate = useCallback((newDate) => {
        setCustom({ date: newDate });
    }, []);

    const handleChangeDateRange = useCallback((newDate, numberOfDays) => {
        if (numberOfDays >= 7) {
            setCustom({
                view: MONTH,
                range: Math.floor(numberOfDays / 7),
                date: newDate
            });
            return;
        }
        setCustom({
            view: WEEK,
            range: numberOfDays,
            date: newDate
        });
    }, []);

    const handleClickDateWeekView = useCallback((newDate) => {
        setDateAndView(newDate, DAY);
    }, []);

    /*
    const handleClickDateYearView = useCallback((newDate) => {
        setDateAndView(newDate, WEEK);
    }, []);

    const handleClickDateAgendaView = useCallback((newDate) => {
        setDateAndView(newDate, WEEK);
    }, []);
    */

    const defaultCalendar = calendars[0];
    const [defaultCalendarBootstrap, loadingCalendarBootstrap] = useCalendarBootstrap(
        defaultCalendar ? defaultCalendar.ID : undefined
    );

    const [containerRef, setContainerRef] = useState();

    const isLoading = loadingCalendarBootstrap || loadingCalendarSettings || loadingEvents || loadingAddresses;

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
            utcDateRangeInTimezone={utcDateRangeInTimezone}
            utcDefaultDate={utcDefaultDate}
            utcDate={utcDate}
            utcDateRange={utcDateRange}
            onCreateEvent={
                disableCreate ? undefined : () => interactiveRef.current && interactiveRef.current.createEvent()
            }
            onClickToday={handleClickToday}
            onChangeDate={handleChangeDate}
            onChangeDateRange={handleChangeDateRange}
            onChangeView={handleChangeView}
            containerRef={setContainerRef}
        >
            <InteractiveCalendarView
                view={view}
                isLoading={isLoading}
                tzid={tzid}
                {...timezoneInformation}
                displayWeekNumbers={displayWeekNumbers}
                displaySecondaryTimezone={displaySecondaryTimezone}
                weekStartsOn={weekStartsOn}
                now={utcNowDateInTimezone}
                date={utcDate}
                dateRange={utcDateRange}
                events={calendarsEvents}
                onClickDate={handleClickDateWeekView}
                onChangeDate={handleChangeDate}
                onInteraction={(active) => setDisableCreate(active)}
                addresses={addresses}
                calendars={calendars}
                defaultCalendar={defaultCalendar}
                defaultCalendarBootstrap={defaultCalendarBootstrap}
                interactiveRef={interactiveRef}
                containerRef={containerRef}
                timeGridViewRef={timeGridViewRef}
            />
            <AlarmContainer calendars={visibleCalendars} tzid={tzid} />
        </CalendarContainerView>
    );
};

export default CalendarContainer;
