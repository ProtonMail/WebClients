import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import {
    useApi,
    useAppTitle,
    useCalendarBootstrap,
    useModalState,
    useNotifications,
    useObserveDrawerIframeAppLocation,
} from '@proton/components';
import { getInvitation } from '@proton/shared/lib/api/calendars';
import { getIsCalendarWritable } from '@proton/shared/lib/calendar/calendar';
import { MAXIMUM_DATE_UTC, MINIMUM_DATE_UTC, VIEWS } from '@proton/shared/lib/calendar/constants';
import {
    getAutoDetectPrimaryTimezone,
    getDefaultTzid,
    getDefaultView,
    getDisplaySecondaryTimezone,
    getDisplayWeekNumbers,
    getInviteLocale,
    getSecondaryTimezone,
} from '@proton/shared/lib/calendar/getSettings';
import { HOUR, SECOND } from '@proton/shared/lib/constants';
import { MILLISECONDS_IN_MINUTE, isSameDay } from '@proton/shared/lib/date-fns-utc';
import {
    convertUTCDateTimeToZone,
    convertZonedDateTimeToUTC,
    formatGMTOffsetAbbreviation,
    fromUTCDate,
    getIsEquivalentTimeZone,
    getTimezone,
    getTimezoneOffset,
    toUTCDate,
} from '@proton/shared/lib/date/timezone';
import { getIsIframe } from '@proton/shared/lib/helpers/browser';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import type { Address, Subscription, UserModel, UserSettings } from '@proton/shared/lib/interfaces';
import type {
    AttendeeModel,
    CalendarMemberInvitation,
    CalendarUserSettings,
    VisualCalendar,
} from '@proton/shared/lib/interfaces/calendar';
import { MEMBER_INVITATION_STATUS } from '@proton/shared/lib/interfaces/calendar';
import { getWeekStartsOn } from '@proton/shared/lib/settings/helper';
import unary from '@proton/utils/unary';

import { getNoonDateForTimeZoneOffset } from '../../helpers/date';
import { embeddedDrawerAppInfos } from '../../helpers/drawer';
import {
    canAskTimezoneSuggestion,
    getTimezoneSuggestionKey,
    saveLastTimezoneSuggestion,
} from '../../helpers/timezoneSuggestion';
import type { OpenedMailEvent } from '../../hooks/useGetOpenedMailEvents';
import AskUpdateTimezoneModal from '../settings/AskUpdateTimezoneModal';
import CalendarContainerView from './CalendarContainerView';
import InteractiveCalendarView from './InteractiveCalendarView';
import ShareCalendarInvitationModal from './ShareCalendarInvitationModal';
import { SUPPORTED_VIEWS_IN_APP, SUPPORTED_VIEWS_IN_DRAWER } from './constants';
import type { CalendarsEventsCache } from './eventStore/interface';
import useCalendarsEvents from './eventStore/useCalendarsEvents';
import getDateRange from './getDateRange';
import getTitleDateString from './getTitleDateString';
import { fromUrlParams, toUrlParams } from './getUrlHelper';
import type { EventTargetAction, InteractiveRef, TimeGridRef } from './interface';
import { useCalendarSearch } from './search/CalendarSearchProvider';

const { DAY, WEEK, MONTH, SEARCH } = VIEWS;

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

// Non-standard reducer, where we don't pass an action, but rather directly the new state
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
    isSmallViewport: boolean;
    drawerView?: VIEWS;
    user: UserModel;
    subscription?: Subscription;
    addresses: Address[];
    activeAddresses: Address[];
    visibleCalendars: VisualCalendar[];
    activeCalendars: VisualCalendar[];
    calendars: VisualCalendar[];
    createEventCalendar?: VisualCalendar;
    userSettings: UserSettings;
    calendarUserSettings: CalendarUserSettings;
    calendarsEventsCacheRef: MutableRefObject<CalendarsEventsCache>;
    eventTargetAction: EventTargetAction | undefined;
    setEventTargetAction: Dispatch<SetStateAction<EventTargetAction | undefined>>;
    shareCalendarInvitationRef: MutableRefObject<{ calendarID: string; invitationID: string } | undefined>;
    startupModalState: { hasModal?: boolean; isOpen: boolean };
    getOpenedMailEvents: () => OpenedMailEvent[];
}

const CalendarContainer = ({
    tzid,
    setCustomTzid,
    isSmallViewport,
    drawerView,
    user,
    subscription,
    addresses,
    activeAddresses,
    calendars,
    activeCalendars,
    visibleCalendars,
    createEventCalendar,
    userSettings,
    calendarUserSettings,
    calendarsEventsCacheRef,
    eventTargetAction,
    setEventTargetAction,
    shareCalendarInvitationRef,
    startupModalState,
    getOpenedMailEvents,
}: Props) => {
    const history = useHistory();
    const location = useLocation();
    const api = useApi();
    const { createNotification } = useNotifications();
    const [disableCreate, setDisableCreate] = useState(false);
    const [shareCalendarInvitation, setShareCalendarInvitation] = useState<CalendarMemberInvitation>();
    const [isAskUpdateTimezoneModalOpen, setIsAskUpdateTimezoneModalOpen] = useState(false);
    const [shareCalendarInvitationModal, setIsSharedCalendarInvitationModalOpen, renderShareCalendarInvitationModal] =
        useModalState();
    useObserveDrawerIframeAppLocation();

    const interactiveRef = useRef<InteractiveRef>(null);
    const timeGridViewRef = useRef<TimeGridRef>(null);
    const { lastNonSearchViewRef, setIsSearching, setSearchInput } = useCalendarSearch();

    const [nowDate, setNowDate] = useState(() => new Date());
    const [localTimezoneId, setLocalTimezoneId] = useState<string>();

    useEffect(() => {
        const handle = setInterval(() => setNowDate(new Date()), 30 * SECOND);
        return () => {
            clearInterval(handle);
        };
    }, []);

    useEffect(() => {
        return () => {
            setCustomTzid('');
        };
    }, []);

    const {
        view: urlView,
        range: urlRange,
        date: urlDate,
    } = useMemo(() => fromUrlParams(location.pathname), [location.pathname]);

    // In the same state object to get around setStates not being batched in the range selector callback.
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
            if (urlView !== SEARCH) {
                lastNonSearchViewRef.current = urlView;
            } else if (urlView === SEARCH) {
                setIsSearching(true);
            }
        }
    }, [urlDate, urlView, urlRange]);

    useEffect(() => {
        const run = async () => {
            if (startupModalState.hasModal === undefined || startupModalState.isOpen) {
                return;
            }
            let doNotShowAskTimezoneUpdateModal =
                !!shareCalendarInvitationRef.current ||
                drawerView ||
                !getAutoDetectPrimaryTimezone(calendarUserSettings);
            if (shareCalendarInvitationRef.current) {
                try {
                    const { calendarID, invitationID } = shareCalendarInvitationRef.current;
                    const { Invitation } = await api<{ Code: number; Invitation: CalendarMemberInvitation }>(
                        getInvitation(calendarID, invitationID)
                    );
                    if (Invitation.Status === MEMBER_INVITATION_STATUS.ACCEPTED) {
                        createNotification({
                            type: 'success',
                            text: c('Info').t`You already joined this calendar`,
                        });
                    } else if (Invitation.Status === MEMBER_INVITATION_STATUS.REJECTED) {
                        createNotification({
                            type: 'error',
                            text: c('Info').t`You previously rejected this invitation. Ask the owner for a re-invite`,
                        });
                    } else {
                        setShareCalendarInvitation(Invitation);
                        setIsSharedCalendarInvitationModalOpen(true);
                    }
                } catch (e) {
                    console.error(e);
                }
            }

            if (doNotShowAskTimezoneUpdateModal) {
                return;
            }

            const localTzid = getTimezone();
            const savedTzid = getDefaultTzid(calendarUserSettings, localTzid);
            const key = await getTimezoneSuggestionKey(user.ID);
            if (!getIsEquivalentTimeZone(localTzid, savedTzid) && canAskTimezoneSuggestion(key)) {
                saveLastTimezoneSuggestion(key);
                setIsAskUpdateTimezoneModalOpen(true);
                setLocalTimezoneId(localTzid);
            }
        };
        void run();
    }, [startupModalState]);

    const utcNowDateInTimezone = useMemo(() => {
        return toUTCDate(convertUTCDateTimeToZone(fromUTCDate(nowDate), tzid));
    }, [nowDate, tzid]);

    const utcDefaultDateRef = useRef<{ prev: Date; value: Date }>();
    // A ref is used to avoid falling on the cache purging of React
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

    const view = (() => {
        const requestedView = customView || defaultView;
        const { view: drawerView, isDrawerApp } = embeddedDrawerAppInfos;

        if (isDrawerApp) {
            return drawerView;
        }

        if (isSmallViewport) {
            return requestedView === SEARCH ? SEARCH : WEEK;
        }

        if (SUPPORTED_VIEWS_IN_APP.includes(requestedView)) {
            return requestedView;
        }

        return WEEK;
    })();

    // Temporary log for debugging
    const prevViewRef = useRef('' as unknown as VIEWS);
    useEffect(() => {
        if (getIsIframe() && SUPPORTED_VIEWS_IN_DRAWER.includes(prevViewRef.current)) {
            captureMessage('Drawer iframe calendar container', {
                level: 'info',
                extra: {
                    defaultView,
                    customView,
                    drawerView,
                    view,
                    locationOrigin: window.location.origin,
                    locationHref: window.location.href,
                },
            });
        }

        if (prevViewRef.current !== view) {
            prevViewRef.current = view;
        }
    }, [view]);

    const range = isSmallViewport ? undefined : getRange(view, customRange);
    const weekStartsOn = getWeekStartsOn(userSettings);
    const displayWeekNumbers = getDisplayWeekNumbers(calendarUserSettings);
    const displaySecondaryTimezone = getDisplaySecondaryTimezone(calendarUserSettings);
    const secondaryTzid = getSecondaryTimezone(calendarUserSettings);
    const inviteLocale = getInviteLocale(calendarUserSettings);

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
        const { PrimaryTimezone, SecondaryTimezone } = calendarUserSettings;
        // in responsive mode we display just one day even though the view is WEEK
        const startDate = isSmallViewport ? utcDate : utcDateRangeInTimezone[0];
        const endDate = isSmallViewport ? new Date(+utcDate + 24 * HOUR) : utcDateRangeInTimezone[1];
        const noonDateInPrimaryTimeZone = getNoonDateForTimeZoneOffset({
            date: startDate,
            dateTzid: tzid,
            targetTzid: PrimaryTimezone,
        });
        const noonDateInSecondaryTimeZone = SecondaryTimezone
            ? getNoonDateForTimeZoneOffset({ date: startDate, dateTzid: tzid, targetTzid: SecondaryTimezone })
            : noonDateInPrimaryTimeZone;
        // if noon date in secondary time zone is not in view, use
        const referenceDateForSecondaryTimeZoneOffset =
            noonDateInSecondaryTimeZone < endDate ? noonDateInSecondaryTimeZone : startDate;
        const { offset } = getTimezoneOffset(noonDateInPrimaryTimeZone, tzid);
        const { offset: secondaryOffset } = SecondaryTimezone
            ? getTimezoneOffset(referenceDateForSecondaryTimeZoneOffset, SecondaryTimezone)
            : { offset };

        return {
            primaryTimezone: `${formatGMTOffsetAbbreviation(offset)}`,
            secondaryTimezone: `${formatGMTOffsetAbbreviation(secondaryOffset)}`,
            secondaryTimezoneOffset: (secondaryOffset - offset) * MILLISECONDS_IN_MINUTE,
        };
    }, [utcDate, utcDateRangeInTimezone, secondaryTzid, tzid, isSmallViewport]);

    useEffect(() => {
        const newRoute = toUrlParams({
            date: utcDate,
            defaultDate: utcDefaultDate,
            view,
            defaultView,
            range,
        });

        if (location.pathname === newRoute) {
            return;
        }

        history.push({ pathname: newRoute, hash: view === SEARCH ? history.location.hash : undefined });
        // Intentionally not listening to everything to only trigger URL updates when these variables change.
    }, [view, range, utcDate]);

    const calendarTitle = useMemo(() => {
        return getTitleDateString(view, range, utcDateRange, utcDate);
    }, [view, range, utcDate, utcDateRange]);

    useAppTitle(calendarTitle);

    const [initializeCacheOnlyCalendarsIDs, setInitializeCacheOnlyCalendarsIDs] = useState<string[]>([]);
    const [calendarsEvents, loadingEvents] = useCalendarsEvents(
        visibleCalendars,
        utcDateRangeInTimezone,
        tzid,
        calendarsEventsCacheRef,
        getOpenedMailEvents,
        initializeCacheOnlyCalendarsIDs,
        () => setInitializeCacheOnlyCalendarsIDs([])
    );

    const scrollToNow = useCallback(() => {
        setTimeout(() => {
            timeGridViewRef.current?.scrollToNow?.();
        }, 10);
    }, []);

    const handleChangeView = useCallback((newView: VIEWS) => {
        setCustom({ view: newView, range: undefined });
        lastNonSearchViewRef.current = newView;
        scrollToNow();
    }, []);

    const handleClickToday = useCallback(() => {
        utcDefaultDateRef.current = undefined; // Purpose: Reset the minicalendar when clicking today multiple times
        setCustom({ date: utcDefaultDate, range: undefined });
        scrollToNow();
    }, [utcDefaultDate]);

    const handleChangeDate = useCallback((newDate: Date) => {
        if (newDate < MINIMUM_DATE_UTC || newDate > MAXIMUM_DATE_UTC) {
            return;
        }
        setCustom({ date: newDate });
    }, []);

    const handleChangeDateAndRevertView = useCallback((newDate: Date) => {
        if (newDate < MINIMUM_DATE_UTC || newDate > MAXIMUM_DATE_UTC) {
            return;
        }
        setCustom({ date: newDate, view: lastNonSearchViewRef.current || defaultView });
    }, []);

    const handleChangeDateRange = useCallback(
        (newDate: Date, numberOfDays: number, resetRange?: boolean) => {
            if (newDate < MINIMUM_DATE_UTC || newDate > MAXIMUM_DATE_UTC) {
                return;
            }

            if (view === SEARCH) {
                setCustom({ date: newDate });
                return;
            }

            if (numberOfDays >= 7) {
                setCustom({
                    view: MONTH,
                    range: Math.floor(numberOfDays / 7),
                    date: newDate,
                });
                lastNonSearchViewRef.current = MONTH;
                return;
            }
            setCustom({
                view: WEEK,
                range: resetRange ? undefined : numberOfDays,
                date: newDate,
            });
            lastNonSearchViewRef.current = WEEK;
        },
        [view]
    );

    const handleClickDateWeekView = useCallback((newDate: Date) => {
        if (newDate < MINIMUM_DATE_UTC || newDate > MAXIMUM_DATE_UTC) {
            return;
        }
        setCustom({ view: DAY, range: undefined, date: newDate });
        lastNonSearchViewRef.current = DAY;
    }, []);

    const handleSearch = useCallback(() => {
        setCustom({ view: SEARCH, range: undefined });
    }, []);

    const handleGoBackFromSearch = useCallback(() => {
        setCustom({ view: lastNonSearchViewRef.current || defaultView });
        setSearchInput('');
    }, []);

    const [createEventCalendarBootstrap, loadingCreateEventCalendarBootstrap] = useCalendarBootstrap(
        createEventCalendar ? createEventCalendar.ID : undefined
    );

    const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);

    const isLoading = loadingCreateEventCalendarBootstrap || loadingEvents;
    const isEventCreationDisabled =
        disableCreate ||
        !createEventCalendarBootstrap ||
        !activeCalendars.some(unary(getIsCalendarWritable)) ||
        view === SEARCH;

    return (
        <CalendarContainerView
            calendarUserSettings={calendarUserSettings}
            calendars={calendars}
            onCreateCalendarFromSidebar={(id: string) => setInitializeCacheOnlyCalendarsIDs([id])}
            isLoading={isLoading}
            displayWeekNumbers={displayWeekNumbers}
            weekStartsOn={weekStartsOn}
            tzid={tzid}
            setTzid={setCustomTzid}
            range={range}
            view={view}
            isSmallViewport={isSmallViewport}
            utcDateRangeInTimezone={utcDateRangeInTimezone}
            utcDefaultDate={utcDefaultDate}
            utcDate={utcDate}
            utcDateRange={utcDateRange}
            onCreateEvent={
                isEventCreationDisabled
                    ? undefined
                    : (attendees: AttendeeModel[] = []) => interactiveRef.current?.createEvent(attendees)
            }
            onBackFromSearch={handleGoBackFromSearch}
            onClickToday={handleClickToday}
            onChangeDate={handleChangeDate}
            onChangeDateRange={handleChangeDateRange}
            onChangeView={handleChangeView}
            containerRef={containerRef}
            setContainerRef={setContainerRef}
            onSearch={handleSearch}
            addresses={addresses}
            isAskUpdateTimezoneModalOpen={isAskUpdateTimezoneModalOpen}
        >
            {!!localTimezoneId && (
                <AskUpdateTimezoneModal
                    isOpen={isAskUpdateTimezoneModalOpen}
                    onClose={() => setIsAskUpdateTimezoneModalOpen(false)}
                    localTzid={localTimezoneId}
                />
            )}
            {renderShareCalendarInvitationModal && shareCalendarInvitation && (
                <ShareCalendarInvitationModal
                    {...shareCalendarInvitationModal}
                    addresses={addresses}
                    calendars={calendars}
                    user={user}
                    subscription={subscription}
                    invitation={shareCalendarInvitation}
                />
            )}

            <InteractiveCalendarView
                view={view}
                isSmallViewport={isSmallViewport}
                isLoading={isLoading}
                tzid={tzid}
                {...timezoneInformation}
                displayWeekNumbers={displayWeekNumbers}
                displaySecondaryTimezone={displaySecondaryTimezone}
                weekStartsOn={weekStartsOn}
                inviteLocale={inviteLocale}
                now={utcNowDateInTimezone}
                date={utcDate}
                dateRange={utcDateRange}
                events={calendarsEvents}
                onClickDate={isSmallViewport ? handleChangeDate : handleClickDateWeekView}
                onChangeDate={handleChangeDate}
                onChangeDateAndRevertView={handleChangeDateAndRevertView}
                onClickToday={handleClickToday}
                isEventCreationDisabled={isEventCreationDisabled}
                onInteraction={(active: boolean) => setDisableCreate(active)}
                calendars={calendars}
                addresses={addresses}
                activeAddresses={activeAddresses}
                activeCalendars={activeCalendars}
                createEventCalendar={createEventCalendar}
                createEventCalendarBootstrap={createEventCalendarBootstrap}
                interactiveRef={interactiveRef}
                containerRef={containerRef}
                timeGridViewRef={timeGridViewRef}
                calendarsEventsCacheRef={calendarsEventsCacheRef}
                eventTargetAction={eventTargetAction}
                setEventTargetAction={setEventTargetAction}
                getOpenedMailEvents={getOpenedMailEvents}
            />
        </CalendarContainerView>
    );
};

export default CalendarContainer;
