import React, { useMemo, useState, useEffect, useReducer, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useCalendarBootstrap, useAddresses, useActiveBreakpoint, useModals } from 'react-components';
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
import { SETTINGS_VIEW } from 'proton-shared/lib/interfaces/calendar';
import { VIEWS, MINIMUM_DATE_UTC, MAXIMUM_DATE_UTC } from '../../constants';
import useCalendarsEvents from './useCalendarsEvents';
import { getDateRange } from './helper';
import CalendarContainerView from './CalendarContainerView';
import InteractiveCalendarView from './InteractiveCalendarView';
import AlarmContainer from '../alarms/AlarmContainer';
import AskUpdateTimezoneModal from '../settings/AskUpdateTimezoneModal';
import { canAskTimezoneSuggestion, saveLastTimezoneSuggestion } from '../../helpers/timezoneSuggestion';
import { getTitleDateString } from './formatHelper';
import {
    getDefaultCalendar,
    getIsCalendarDisabled,
    getProbablyActiveCalendars
} from 'proton-shared/lib/calendar/calendar';

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

    if (year >= 0 && year <= 9999 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const wantedDate = new Date(Date.UTC(year, month - 1, day));
        if (wantedDate >= MINIMUM_DATE_UTC && wantedDate <= MAXIMUM_DATE_UTC) {
            return wantedDate;
        }
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
    return Math.min(max, 5);
};

const getDefaultCalendarID = ({ DefaultCalendarID } = {}) => {
    // DefaultCalendarID is either null or a string
    return DefaultCalendarID || undefined;
};

const getWeekStartsOn = ({ WeekStart = 0 } = {}) => {
    // Sunday should be 0, not 7
    return WeekStart % 7;
};

const getAutoDetectPrimaryTimezone = ({ AutoDetectPrimaryTimezone = false } = {}) => {
    return !!AutoDetectPrimaryTimezone;
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

export const getTzid = ({ PrimaryTimezone } = {}, defaultTimezone) => {
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

/** @type any **/
const CalendarContainer = ({ calendars, calendarUserSettings, history, location }) => {
    const [addresses, loadingAddresses] = useAddresses();
    const [disableCreate, setDisableCreate] = useState(false);
    const { isNarrow } = useActiveBreakpoint();

    const { createModal } = useModals();

    const interactiveRef = useRef();
    const timeGridViewRef = useRef();

    const [activeCalendars, disabledCalendars, visibleCalendars] = useMemo(() => {
        return [
            getProbablyActiveCalendars(calendars),
            calendars.filter((calendar) => getIsCalendarDisabled(calendar)),
            calendars.filter(({ Display }) => !!Display)
        ];
    }, [calendars]);

    const [nowDate, setNowDate] = useState(() => new Date());

    useEffect(() => {
        const handle = setInterval(() => setNowDate(new Date()), 30000);
        return () => {
            clearInterval(handle);
        };
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
    const savedTzid = getTzid(calendarUserSettings, localTzid);
    const tzid = customTzid || savedTzid;

    useEffect(() => {
        const hasAutoDetectPrimaryTimezone = getAutoDetectPrimaryTimezone(calendarUserSettings);
        if (!hasAutoDetectPrimaryTimezone) {
            return;
        }
        const localTzid = getTimezone();
        const savedTzid = getTzid(calendarUserSettings, localTzid);
        if (savedTzid !== localTzid && canAskTimezoneSuggestion()) {
            saveLastTimezoneSuggestion();
            createModal(<AskUpdateTimezoneModal localTzid={localTzid} />);
        }
    }, []);

    const utcNowDateInTimezone = useMemo(() => {
        return toUTCDate(convertUTCDateTimeToZone(fromUTCDate(nowDate), tzid));
    }, [nowDate, tzid]);

    const utcDefaultDateRef = useRef();
    // A ref is used to avoid falling on the cache purging of react
    if (
        !utcDefaultDateRef.current ||
        (utcDefaultDateRef.current.prev !== utcNowDateInTimezone &&
            !isSameDay(utcDefaultDateRef.current.value, utcNowDateInTimezone))
    ) {
        utcDefaultDateRef.current = {
            prev: utcNowDateInTimezone,
            value: new Date(
                Date.UTC(
                    utcNowDateInTimezone.getUTCFullYear(),
                    utcNowDateInTimezone.getUTCMonth(),
                    utcNowDateInTimezone.getUTCDate()
                )
            )
        };
    }
    const utcDefaultDate = utcDefaultDateRef.current.value;

    const utcDate = customUtcDate || utcDefaultDate;

    const defaultView = getDefaultView(calendarUserSettings);
    const requestedView = customView || defaultView;
    const view = isNarrow ? WEEK : SUPPORTED_VIEWS.includes(requestedView) ? requestedView : WEEK;

    const range = isNarrow ? undefined : getRange(view, customRange);
    const weekStartsOn = getWeekStartsOn(calendarUserSettings);
    const displayWeekNumbers = getDisplayWeekNumbers(calendarUserSettings);
    const displaySecondaryTimezone = getDisplaySecondaryTimezone(calendarUserSettings);
    const secondaryTzid = getSecondaryTimezone(calendarUserSettings);

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

    useEffect(() => {
        const titleDateString = getTitleDateString(view, range, utcDateRange, utcDate);
        document.title = [titleDateString, 'ProtonCalendar'].filter(Boolean).join(' - ');
    }, [view, range, utcDate, utcDateRange]);

    const [calendarsEvents, loadingEvents, getCachedEvent] = useCalendarsEvents(
        visibleCalendars,
        utcDateRangeInTimezone,
        tzid
    );

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
        utcDefaultDateRef.current = undefined; // Purpose: Reset the minicalendar when clicking today multiple times
        setCustom({ date: utcDefaultDate });
        scrollToNow();
    }, [utcDefaultDate]);

    const handleChangeDate = useCallback((newDate) => {
        if (newDate < MINIMUM_DATE_UTC || newDate > MAXIMUM_DATE_UTC) {
            return;
        }
        setCustom({ date: newDate });
    }, []);

    const handleChangeDateRange = useCallback((newDate, numberOfDays) => {
        if (newDate < MINIMUM_DATE_UTC || newDate > MAXIMUM_DATE_UTC) {
            return;
        }
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
        if (newDate < MINIMUM_DATE_UTC || newDate > MAXIMUM_DATE_UTC) {
            return;
        }
        setCustom({ view: DAY, range: undefined, date: newDate });
    }, []);

    const defaultCalendarSettingsID = getDefaultCalendarID(calendarUserSettings);
    const defaultCalendar = useMemo(() => {
        return getDefaultCalendar(activeCalendars, defaultCalendarSettingsID);
    }, [defaultCalendarSettingsID, activeCalendars]);
    const [defaultCalendarBootstrap, loadingCalendarBootstrap] = useCalendarBootstrap(
        defaultCalendar ? defaultCalendar.ID : undefined
    );

    const [containerRef, setContainerRef] = useState();

    const isLoading = loadingCalendarBootstrap || loadingEvents || loadingAddresses;

    return (
        <CalendarContainerView
            activeCalendars={activeCalendars}
            disabledCalendars={disabledCalendars}
            isLoading={isLoading}
            displayWeekNumbers={displayWeekNumbers}
            weekStartsOn={weekStartsOn}
            tzid={tzid}
            setTzid={setCustomTzid}
            range={range}
            view={view}
            isNarrow={isNarrow}
            utcDateRangeInTimezone={utcDateRangeInTimezone}
            utcDefaultDate={utcDefaultDate}
            utcDate={utcDate}
            utcDateRange={utcDateRange}
            onCreateEvent={
                disableCreate || !defaultCalendarBootstrap
                    ? undefined
                    : () => interactiveRef.current && interactiveRef.current.createEvent()
            }
            onClickToday={handleClickToday}
            onChangeDate={handleChangeDate}
            onChangeDateRange={handleChangeDateRange}
            onChangeView={handleChangeView}
            containerRef={setContainerRef}
        >
            <InteractiveCalendarView
                view={view}
                isNarrow={isNarrow}
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
                onClickDate={isNarrow ? handleChangeDate : handleClickDateWeekView}
                onChangeDate={handleChangeDate}
                onInteraction={(active) => setDisableCreate(active)}
                addresses={addresses}
                activeCalendars={activeCalendars}
                defaultCalendar={defaultCalendar}
                defaultCalendarBootstrap={defaultCalendarBootstrap}
                interactiveRef={interactiveRef}
                containerRef={containerRef}
                timeGridViewRef={timeGridViewRef}
            />
            <AlarmContainer calendars={visibleCalendars} tzid={tzid} getCachedEvent={getCachedEvent} />
        </CalendarContainerView>
    );
};

CalendarContainer.propTypes = {
    calendars: PropTypes.array,
    history: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired
};

export default CalendarContainer;
