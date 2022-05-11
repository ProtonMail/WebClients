import { MutableRefObject, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { useApi, useAppTitle, useCalendarBootstrap, useModalState, useNotifications } from '@proton/components';
import { getInvitation } from '@proton/shared/lib/api/calendars';
import { getIsCalendarWritable, getIsPersonalCalendar } from '@proton/shared/lib/calendar/calendar';
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
import { SECOND } from '@proton/shared/lib/constants';
import { MILLISECONDS_IN_MINUTE, isSameDay } from '@proton/shared/lib/date-fns-utc';
import {
    convertUTCDateTimeToZone,
    convertZonedDateTimeToUTC,
    formatGMTOffsetAbbreviation,
    fromUTCDate,
    getTimezone,
    getTimezoneOffset,
    toUTCDate,
} from '@proton/shared/lib/date/timezone';
import { Address, UserModel, UserSettings } from '@proton/shared/lib/interfaces';
import {
    AttendeeModel,
    CalendarMemberInvitation,
    CalendarUserSettings,
    MEMBER_INVITATION_STATUS,
    VisualCalendar,
} from '@proton/shared/lib/interfaces/calendar';
import { getWeekStartsOn } from '@proton/shared/lib/settings/helper';
import unary from '@proton/utils/unary';

import { getNoonDateForTimeZoneOffset } from '../../helpers/date';
import {
    canAskTimezoneSuggestion,
    getTimezoneSuggestionKey,
    saveLastTimezoneSuggestion,
} from '../../helpers/timezoneSuggestion';
import { OpenedMailEvent } from '../../hooks/useGetOpenedMailEvents';
import AskUpdateTimezoneModal from '../settings/AskUpdateTimezoneModal';
import CalendarContainerView from './CalendarContainerView';
import InteractiveCalendarView from './InteractiveCalendarView';
import ShareCalendarInvitationModal from './ShareCalendarInvitationModal';
import { SUPPORTED_VIEWS_IN_APP, SUPPORTED_VIEWS_IN_SIDE_APP } from './constants';
import { CalendarsEventsCache } from './eventStore/interface';
import useCalendarsEvents from './eventStore/useCalendarsEvents';
import getDateRange from './getDateRange';
import getTitleDateString from './getTitleDateString';
import { fromUrlParams, toUrlParams } from './getUrlHelper';
import { EventTargetAction, InteractiveRef, TimeGridRef } from './interface';

const { DAY, WEEK, MONTH } = VIEWS;

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
    sideAppView?: VIEWS;
    user: UserModel;
    addresses: Address[];
    activeAddresses: Address[];
    visibleCalendars: VisualCalendar[];
    activeCalendars: VisualCalendar[];
    calendars: VisualCalendar[];
    defaultCalendar?: VisualCalendar;
    userSettings: UserSettings;
    calendarUserSettings: CalendarUserSettings;
    calendarsEventsCacheRef: MutableRefObject<CalendarsEventsCache>;
    eventTargetActionRef: MutableRefObject<EventTargetAction | undefined>;
    shareCalendarInvitationRef: MutableRefObject<{ calendarID: string; invitationID: string } | undefined>;
    startupModalState: { hasModal?: boolean; isOpen: boolean };
    getOpenedMailEvents: () => OpenedMailEvent[];
}

const CalendarContainer = ({
    tzid,
    setCustomTzid,
    isNarrow,
    sideAppView,
    user,
    addresses,
    activeAddresses,
    calendars,
    activeCalendars,
    visibleCalendars,
    defaultCalendar,
    userSettings,
    calendarUserSettings,
    calendarsEventsCacheRef,
    eventTargetActionRef,
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

    const interactiveRef = useRef<InteractiveRef>(null);
    const timeGridViewRef = useRef<TimeGridRef>(null);

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
        const run = async () => {
            if (startupModalState.hasModal === undefined || startupModalState.isOpen) {
                return;
            }
            let doNotShowAskTimezoneUpdateModal =
                !!shareCalendarInvitationRef.current ||
                sideAppView ||
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
            if (savedTzid !== localTzid && canAskTimezoneSuggestion(key)) {
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
    const view = (() => {
        if (SUPPORTED_VIEWS_IN_SIDE_APP.includes(requestedView)) {
            return requestedView;
        }
        if (isNarrow) {
            return WEEK;
        }

        if (SUPPORTED_VIEWS_IN_APP.includes(requestedView)) {
            return requestedView;
        }

        return WEEK;
    })();

    const range = isNarrow ? undefined : getRange(view, customRange);
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
        // in responsive mode we display just one day even though the view is WEEK
        const startDate = isNarrow ? utcDate : utcDateRangeInTimezone[0];
        const noonDate = getNoonDateForTimeZoneOffset(startDate);
        const { offset } = getTimezoneOffset(noonDate, tzid);
        const { offset: secondaryOffset } = getTimezoneOffset(noonDate, secondaryTzid || tzid);
        return {
            primaryTimezone: `${formatGMTOffsetAbbreviation(offset)}`,
            secondaryTimezone: `${formatGMTOffsetAbbreviation(secondaryOffset)}`,
            secondaryTimezoneOffset: (secondaryOffset - offset) * MILLISECONDS_IN_MINUTE,
        };
    }, [utcDate, utcDateRangeInTimezone, secondaryTzid, tzid, isNarrow]);

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
        history.push({ pathname: newRoute });
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

    const handleChangeDateRange = useCallback((newDate: Date, numberOfDays: number, resetRange?: boolean) => {
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
            range: resetRange ? undefined : numberOfDays,
            date: newDate,
        });
    }, []);

    const handleClickDateWeekView = useCallback((newDate: Date) => {
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
    const isEventCreationDisabled =
        disableCreate || !defaultCalendarBootstrap || !activeCalendars.some(unary(getIsCalendarWritable));

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
            isNarrow={isNarrow}
            utcDateRangeInTimezone={utcDateRangeInTimezone}
            utcDefaultDate={utcDefaultDate}
            utcDate={utcDate}
            utcDateRange={utcDateRange}
            onCreateEvent={
                isEventCreationDisabled
                    ? undefined
                    : (attendees: AttendeeModel[] = []) => interactiveRef.current?.createEvent(attendees)
            }
            onClickToday={handleClickToday}
            onChangeDate={handleChangeDate}
            onChangeDateRange={handleChangeDateRange}
            onChangeView={handleChangeView}
            containerRef={setContainerRef}
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
                    personalCalendars={calendars.filter(unary(getIsPersonalCalendar))}
                    user={user}
                    invitation={shareCalendarInvitation}
                />
            )}

            <InteractiveCalendarView
                view={view}
                isNarrow={isNarrow}
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
                onClickDate={isNarrow ? handleChangeDate : handleClickDateWeekView}
                onChangeDate={handleChangeDate}
                isEventCreationDisabled={isEventCreationDisabled}
                onInteraction={(active: boolean) => setDisableCreate(active)}
                calendars={calendars}
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
                getOpenedMailEvents={getOpenedMailEvents}
            />
        </CalendarContainerView>
    );
};

export default CalendarContainer;
