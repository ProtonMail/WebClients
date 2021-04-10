import { MAXIMUM_DATE_UTC, MINIMUM_DATE_UTC, VIEWS } from 'proton-shared/lib/calendar/constants';
import React, { useMemo, useState, useEffect, useReducer, useCallback, useRef, MutableRefObject } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useAppTitle, useCalendarBootstrap, useModals } from 'react-components';
import {
    convertUTCDateTimeToZone,
    convertZonedDateTimeToUTC,
    fromUTCDate,
    toUTCDate,
    getTimezone,
    formatTimezoneOffset,
    getTimezoneOffset,
} from 'proton-shared/lib/date/timezone';
import { isSameDay, MILLISECONDS_IN_MINUTE } from 'proton-shared/lib/date-fns-utc';
import { Calendar, CalendarUserSettings } from 'proton-shared/lib/interfaces/calendar';
import { Address, UserSettings, User } from 'proton-shared/lib/interfaces';
import { getWeekStartsOn } from 'proton-shared/lib/settings/helper';
import ContactEmailsProvider from './ContactEmailsProvider';
import useCalendarsEvents from './eventStore/useCalendarsEvents';
import CalendarContainerView from './CalendarContainerView';
import InteractiveCalendarView from './InteractiveCalendarView';
import AskUpdateTimezoneModal from '../settings/AskUpdateTimezoneModal';
import {
    canAskTimezoneSuggestion,
    getTimezoneSuggestionKey,
    saveLastTimezoneSuggestion,
} from '../../helpers/timezoneSuggestion';
import getDateRange from './getDateRange';
import getTitleDateString from './getTitleDateString';
import {
    getAutoDetectPrimaryTimezone,
    getDefaultView,
    getDisplaySecondaryTimezone,
    getDisplayWeekNumbers,
    getSecondaryTimezone,
    getDefaultTzid,
} from './getSettings';
import { fromUrlParams, toUrlParams } from './getUrlHelper';
import { EventTargetAction, InteractiveRef, TimeGridRef } from './interface';
import { CalendarsEventsCache } from './eventStore/interface';

const { DAY, WEEK, MONTH } = VIEWS;

const SUPPORTED_VIEWS = [MONTH, WEEK, DAY];

const getRange = (view: VIEWS, range: number) => {
    if (!range) {
        return;
    }
    const max = Math.max(Math.min(range, 6), 1);
    if (view === WEEK) {
        return max;
    }
    return Math.min(max, 5);
};

const formatAbbreviation = (offset: number) => {
    return `GMT${formatTimezoneOffset(offset)}`;
};

const customReducer = (oldState: { [key: string]: any }, newState: { [key: string]: any }) => {
    const keys = Object.keys(newState);
    for (const key of keys) {
        // If there is a difference in any of the keys, return a new object.
        if (oldState[key] !== newState[key]) {
            return {
                ...oldState,
                ...newState,
            };
        }
    }
    // Otherwise return the old state to prevent a re-render
    return oldState;
};

interface Props {
    tzid: string;
    setCustomTzid: (tzid: string) => void;
    isNarrow: boolean;
    user: User;
    addresses: Address[];
    activeAddresses: Address[];
    visibleCalendars: Calendar[];
    activeCalendars: Calendar[];
    disabledCalendars: Calendar[];
    defaultCalendar?: Calendar;
    userSettings: UserSettings;
    calendarUserSettings: CalendarUserSettings;
    calendarsEventsCacheRef: MutableRefObject<CalendarsEventsCache>;
    eventTargetActionRef: MutableRefObject<EventTargetAction | undefined>;
}
const CalendarContainer = ({
    tzid,
    setCustomTzid,
    isNarrow,
    user,
    addresses,
    activeAddresses,
    activeCalendars,
    disabledCalendars,
    visibleCalendars,
    defaultCalendar,
    userSettings,
    calendarUserSettings,
    calendarsEventsCacheRef,
    eventTargetActionRef,
}: Props) => {
    const history = useHistory();
    const location = useLocation();
    const [disableCreate, setDisableCreate] = useState(false);

    const { createModal } = useModals();

    const interactiveRef = useRef<InteractiveRef>(null);
    const timeGridViewRef = useRef<TimeGridRef>(null);

    const [nowDate, setNowDate] = useState(() => new Date());

    useEffect(() => {
        const handle = setInterval(() => setNowDate(new Date()), 30000);
        return () => {
            clearInterval(handle);
        };
    }, []);

    useEffect(() => {
        return () => {
            setCustomTzid('');
        };
    }, []);

    const { view: urlView, range: urlRange, date: urlDate } = useMemo(() => fromUrlParams(location.pathname), [
        location.pathname,
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

    useEffect(() => {
        const hasAutoDetectPrimaryTimezone = getAutoDetectPrimaryTimezone(calendarUserSettings);
        if (!hasAutoDetectPrimaryTimezone) {
            return;
        }
        const run = async () => {
            const localTzid = getTimezone();
            const savedTzid = getDefaultTzid(calendarUserSettings, localTzid);
            const key = await getTimezoneSuggestionKey(user.ID);
            if (savedTzid !== localTzid && canAskTimezoneSuggestion(key)) {
                saveLastTimezoneSuggestion(key);
                createModal(<AskUpdateTimezoneModal localTzid={localTzid} />);
            }
        };
        run();
    }, []);

    const utcNowDateInTimezone = useMemo(() => {
        return toUTCDate(convertUTCDateTimeToZone(fromUTCDate(nowDate), tzid));
    }, [nowDate, tzid]);

    const utcDefaultDateRef = useRef<{ prev: Date; value: Date }>();
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
            ),
        };
    }
    const utcDefaultDate = utcDefaultDateRef.current.value;

    const utcDate = customUtcDate || utcDefaultDate;

    const defaultView = getDefaultView(calendarUserSettings);
    const requestedView = customView || defaultView;
    const view = isNarrow ? WEEK : SUPPORTED_VIEWS.includes(requestedView) ? requestedView : WEEK;

    const range = isNarrow ? undefined : getRange(view, customRange);
    const weekStartsOn = getWeekStartsOn(userSettings);
    const displayWeekNumbers = getDisplayWeekNumbers(calendarUserSettings);
    const displaySecondaryTimezone = getDisplaySecondaryTimezone(calendarUserSettings);
    const secondaryTzid = getSecondaryTimezone(calendarUserSettings);

    const utcDateRange = useMemo(() => {
        return getDateRange(utcDate, range, view, weekStartsOn);
    }, [view, utcDate, weekStartsOn, range]);

    const utcDateRangeInTimezone = useMemo(
        (): [Date, Date] => [
            toUTCDate(convertZonedDateTimeToUTC(fromUTCDate(utcDateRange[0]), tzid)),
            toUTCDate(convertZonedDateTimeToUTC(fromUTCDate(utcDateRange[1]), tzid)),
        ],
        [utcDateRange, tzid]
    );

    const timezoneInformation = useMemo(() => {
        const [startDate] = utcDateRangeInTimezone;
        const { offset } = getTimezoneOffset(startDate, tzid);
        const { offset: secondaryOffset } = getTimezoneOffset(startDate, secondaryTzid || tzid);
        return {
            primaryTimezone: `${formatAbbreviation(offset)}`,
            secondaryTimezone: `${formatAbbreviation(secondaryOffset)}`,
            secondaryTimezoneOffset: (secondaryOffset - offset) * MILLISECONDS_IN_MINUTE,
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

    const calendarTitle = useMemo(() => {
        return getTitleDateString(view, range, utcDateRange, utcDate);
    }, [view, range, utcDate, utcDateRange]);

    useAppTitle(calendarTitle);

    const [calendarsEvents, loadingEvents] = useCalendarsEvents(
        visibleCalendars,
        utcDateRangeInTimezone,
        tzid,
        calendarsEventsCacheRef
    );

    const scrollToNow = useCallback(() => {
        setTimeout(() => {
            timeGridViewRef.current?.scrollToNow?.();
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
                date: newDate,
            });
            return;
        }
        setCustom({
            view: WEEK,
            range: numberOfDays,
            date: newDate,
        });
    }, []);

    const handleClickDateWeekView = useCallback((newDate) => {
        if (newDate < MINIMUM_DATE_UTC || newDate > MAXIMUM_DATE_UTC) {
            return;
        }
        setCustom({ view: DAY, range: undefined, date: newDate });
    }, []);

    const [defaultCalendarBootstrap, loadingCalendarBootstrap] = useCalendarBootstrap(
        defaultCalendar ? defaultCalendar.ID : undefined
    );

    const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);

    const isLoading = loadingCalendarBootstrap || loadingEvents;

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
                disableCreate || !defaultCalendarBootstrap ? undefined : () => interactiveRef.current?.createEvent()
            }
            onClickToday={handleClickToday}
            onChangeDate={handleChangeDate}
            onChangeDateRange={handleChangeDateRange}
            onChangeView={handleChangeView}
            containerRef={setContainerRef}
        >
            <ContactEmailsProvider>
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
                    onInteraction={(active: boolean) => setDisableCreate(active)}
                    addresses={addresses}
                    activeAddresses={activeAddresses}
                    activeCalendars={activeCalendars}
                    defaultCalendar={defaultCalendar}
                    defaultCalendarBootstrap={defaultCalendarBootstrap}
                    interactiveRef={interactiveRef}
                    containerRef={containerRef}
                    timeGridViewRef={timeGridViewRef}
                    calendarsEventsCacheRef={calendarsEventsCacheRef}
                    eventTargetActionRef={eventTargetActionRef}
                />
            </ContactEmailsProvider>
        </CalendarContainerView>
    );
};

export default CalendarContainer;
