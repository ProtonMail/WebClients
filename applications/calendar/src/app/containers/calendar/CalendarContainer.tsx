import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { useCalendarBootstrap } from '@proton/calendar/calendarBootstrap/hooks';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import useObserveDrawerIframeAppLocation from '@proton/components/hooks/drawer/useObserveDrawerIframeAppLocation';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import useApi from '@proton/components/hooks/useApi';
import useAppTitle from '@proton/components/hooks/useAppTitle';
import useNotifications from '@proton/components/hooks/useNotifications';
import type { Subscription } from '@proton/payments';
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
    convertZonedDateTimeToUTC,
    formatGMTOffsetAbbreviation,
    fromUTCDate,
    fromUTCDateToTimezone,
    getIsEquivalentTimeZone,
    getTimezone,
    getTimezoneOffset,
    toUTCDate,
} from '@proton/shared/lib/date/timezone';
import { getIsIframe } from '@proton/shared/lib/helpers/browser';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import type { Address, UserModel, UserSettings } from '@proton/shared/lib/interfaces';
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
import { useCalendarCEDTMetric } from '../../metrics/useCalendarCEDTMetric';
import { useCalendarPTTMetric } from '../../metrics/useCalendarPTTMetric';
import { useBookings } from '../bookings/bookingsProvider/BookingsProvider';
import AskUpdateTimezoneModal from '../settings/AskUpdateTimezoneModal';
import CalendarContainerView from './CalendarContainerView';
import InteractiveCalendarView from './InteractiveCalendarView';
import ShareCalendarInvitationModal from './ShareCalendarInvitationModal';
import { SUPPORTED_VIEWS_IN_APP, SUPPORTED_VIEWS_IN_DRAWER } from './constants';
import type { CalendarsEventsCache } from './eventStore/interface';
import useCalendarsEvents from './eventStore/useCalendarsEvents';
import getDateDiff from './getDateDiff';
import getDateRange from './getDateRange';
import getTitleDateString from './getTitleDateString';
import { fromUrlParams, toUrlParams } from './getUrlHelper';
import type { EventTargetAction, InteractiveRef, TimeGridRef } from './interface';
import { useCalendarSearch } from './search/CalendarSearchProvider';

const getRange = (view: VIEWS, range: number) => {
    if (!range) {
        return range;
    }
    const max = Math.max(Math.min(range, 6), 1);
    if (view === VIEWS.WEEK) {
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
    startupModalOpen?: boolean;
    getOpenedMailEvents: () => OpenedMailEvent[];
}

const CalendarContainer = ({
    tzid,
    setCustomTzid,
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
    startupModalOpen,
    getOpenedMailEvents,
}: Props) => {
    const history = useHistory();
    const location = useLocation();
    const containerRef = useRef<HTMLDivElement>(null);
    const api = useApi();
    const { createNotification } = useNotifications();
    const [disableCreate, setDisableCreate] = useState(false);
    const [shareCalendarInvitation, setShareCalendarInvitation] = useState<CalendarMemberInvitation>();
    const [isAskUpdateTimezoneModalOpen, setIsAskUpdateTimezoneModalOpen] = useState(false);
    const [shareCalendarInvitationModal, setIsSharedCalendarInvitationModalOpen, renderShareCalendarInvitationModal] =
        useModalState();
    useObserveDrawerIframeAppLocation();

    const { viewportWidth } = useActiveBreakpoint();

    const interactiveRef = useRef<InteractiveRef>(null);
    const timeGridViewRef = useRef<TimeGridRef>(null);
    const { lastNonSearchViewRef, setIsSearching, setSearchInput } = useCalendarSearch();

    const [nowDate, setNowDate] = useState(() => new Date());
    const [localTimezoneId, setLocalTimezoneId] = useState<string>();

    const { isBookingActive } = useBookings();

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
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-3FD9A8
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
            if (urlView !== VIEWS.SEARCH) {
                lastNonSearchViewRef.current = urlView;
            } else if (urlView === VIEWS.SEARCH) {
                setIsSearching(true);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-6A6A5F
    }, [urlDate, urlView, urlRange]);

    useEffect(() => {
        const run = async () => {
            if (startupModalOpen === true || startupModalOpen === undefined) {
                return;
            }
            const doNotShowAskTimezoneUpdateModal =
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
                    // eslint-disable-next-line no-console
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
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-0283A8
    }, [startupModalOpen]);

    const utcNowDateInTimezone = useMemo(() => {
        return fromUTCDateToTimezone(nowDate, tzid);
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
        if (isBookingActive) {
            // We want to reset the custom range if present to have the week view
            return VIEWS.WEEK;
        }

        const requestedView = customView || defaultView;
        const { view: drawerView, isDrawerApp } = embeddedDrawerAppInfos;

        if (isDrawerApp) {
            return drawerView;
        }

        if (viewportWidth['<=small']) {
            return requestedView === VIEWS.SEARCH ? VIEWS.SEARCH : VIEWS.WEEK;
        }

        if (SUPPORTED_VIEWS_IN_APP.includes(requestedView)) {
            return requestedView;
        }

        return VIEWS.WEEK;
    })();

    const { stopCEDTMetric } = useCalendarCEDTMetric();
    const { startPTTMetric, stopPTTMetric } = useCalendarPTTMetric();

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
            if (!!prevViewRef.current) {
                startPTTMetric(prevViewRef.current);
            }
            prevViewRef.current = view;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-BF5273
    }, [view]);

    // We don't want the custom range when booking is active, and we want to preserve it's value to go back once booking is done
    const tmpCustomRange = isBookingActive ? undefined : customRange;
    const range = viewportWidth['<=small'] ? 0 : getRange(view, tmpCustomRange);
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
        const startDate = viewportWidth['<=small'] ? utcDate : utcDateRangeInTimezone[0];
        const endDate = viewportWidth['<=small'] ? new Date(+utcDate + 24 * HOUR) : utcDateRangeInTimezone[1];
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
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-E26E0F
    }, [utcDate, utcDateRangeInTimezone, secondaryTzid, tzid, viewportWidth['<=small']]);

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

        history.push({ pathname: newRoute, hash: view === VIEWS.SEARCH ? history.location.hash : undefined });
        // Intentionally not listening to everything to only trigger URL updates when these variables change.
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-AF4DE2
    }, [view, range, utcDate]);

    const calendarTitle = useMemo(() => {
        return getTitleDateString(view, range, utcDateRange, utcDate);
    }, [view, range, utcDate, utcDateRange]);

    useAppTitle(calendarTitle);

    const [initializeCacheOnlyCalendarsIDs, setInitializeCacheOnlyCalendarsIDs] = useState<string[]>([]);
    const [calendarsEvents, loadingEvents, prefetchCalendarEvents] = useCalendarsEvents({
        calendarsEventsCacheRef,
        getOpenedMailEvents,
        initializeCacheOnlyCalendarsIDs,
        onCacheInitialized: () => setInitializeCacheOnlyCalendarsIDs([]),
        requestedCalendars: visibleCalendars,
        tzid,
        utcDateRange: utcDateRangeInTimezone,
    });

    const scrollToNow = useCallback(() => {
        setTimeout(() => {
            timeGridViewRef.current?.scrollToNow?.();
        }, 10);
    }, []);

    const handleChangeView = useCallback((newView: VIEWS) => {
        setCustom({ view: newView, range: undefined });
        lastNonSearchViewRef.current = newView;
        scrollToNow();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-6AC41A
    }, []);

    const handleClickToday = useCallback(() => {
        utcDefaultDateRef.current = undefined; // Purpose: Reset the minicalendar when clicking today multiple times
        setCustom({ date: utcDefaultDate, range: undefined });
        scrollToNow();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-6C1278
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
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-60C78C
    }, []);

    const handleChangeDateRange = useCallback(
        (newDate: Date, numberOfDays: number, resetRange?: boolean) => {
            if (newDate < MINIMUM_DATE_UTC || newDate > MAXIMUM_DATE_UTC) {
                return;
            }

            if (view === VIEWS.SEARCH) {
                setCustom({ date: newDate });
                return;
            }

            if (numberOfDays >= 7) {
                setCustom({
                    view: VIEWS.MONTH,
                    range: Math.floor(numberOfDays / 7),
                    date: newDate,
                });
                lastNonSearchViewRef.current = VIEWS.MONTH;
                return;
            }
            setCustom({
                view: VIEWS.WEEK,
                range: resetRange ? undefined : numberOfDays,
                date: newDate,
            });
            lastNonSearchViewRef.current = VIEWS.WEEK;
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-791D84
        [view]
    );

    const handleClickDateWeekView = useCallback((newDate: Date) => {
        if (newDate < MINIMUM_DATE_UTC || newDate > MAXIMUM_DATE_UTC) {
            return;
        }
        setCustom({ view: VIEWS.DAY, range: undefined, date: newDate });
        lastNonSearchViewRef.current = VIEWS.DAY;
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-9BEC84
    }, []);

    const handleSearch = useCallback(() => {
        setCustom({ view: VIEWS.SEARCH, range: undefined });
    }, []);

    const handleGoBackFromSearch = useCallback(() => {
        setCustom({ view: lastNonSearchViewRef.current || defaultView });
        setSearchInput('');
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-AE97B0
    }, []);

    const handleClickNext = useCallback(() => {
        startPTTMetric?.(view, false, true);
        handleChangeDate(getDateDiff(utcDate, range, view, 1));
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-6EF7E0
    }, [utcDate, range, view]);

    const handleClickPrev = useCallback(() => {
        startPTTMetric?.(view, true);
        handleChangeDate(getDateDiff(utcDate, range, view, -1));
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-9FA701
    }, [utcDate, range, view]);

    const [createEventCalendarBootstrap] = useCalendarBootstrap(
        createEventCalendar ? createEventCalendar.ID : undefined
    );

    const isLoading = loadingEvents;
    const isEventCreationDisabled =
        disableCreate ||
        !createEventCalendarBootstrap ||
        !activeCalendars.some(unary(getIsCalendarWritable)) ||
        view === VIEWS.SEARCH;

    useEffect(() => {
        if (isLoading || calendarsEvents.some((event) => !event.data.eventReadResult)) {
            return;
        }
        stopCEDTMetric(view);
        stopPTTMetric();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-B70E54
    }, [calendarsEvents]);

    return (
        <CalendarContainerView
            calendarUserSettings={calendarUserSettings}
            calendars={calendars}
            onCreateCalendarFromSidebar={(id: string) => setInitializeCacheOnlyCalendarsIDs([id])}
            prefetchCalendarEvents={prefetchCalendarEvents}
            isLoading={isLoading}
            displayWeekNumbers={displayWeekNumbers}
            weekStartsOn={weekStartsOn}
            tzid={tzid}
            setTzid={setCustomTzid}
            range={range}
            view={view}
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
            onClickNextView={handleClickNext}
            onClickPreviousView={handleClickPrev}
            onChangeDate={handleChangeDate}
            onChangeDateRange={handleChangeDateRange}
            onChangeView={handleChangeView}
            containerRef={containerRef}
            onSearch={handleSearch}
            addresses={addresses}
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
                onClickDate={viewportWidth['<=small'] ? handleChangeDate : handleClickDateWeekView}
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
                onBackFromSearch={handleGoBackFromSearch}
            />
        </CalendarContainerView>
    );
};

export default CalendarContainer;
