import { useMemo, useRef, useState } from 'react';
import { Redirect, Route, Switch } from 'react-router';

import {
    useActiveBreakpoint,
    useCalendarUserSettings,
    useCalendarsInfoListener,
    useUserSettings,
} from '@proton/components';
import ContactEmailsProvider from '@proton/components/containers/contacts/ContactEmailsProvider';
import {
    DEFAULT_CALENDAR_USER_SETTINGS,
    getDefaultCalendar,
    getProbablyActiveCalendars,
} from '@proton/shared/lib/calendar/calendar';
import { VIEWS } from '@proton/shared/lib/calendar/constants';
import { getDefaultTzid } from '@proton/shared/lib/calendar/getSettings';
import { getTimezone } from '@proton/shared/lib/date/timezone';
import { getActiveAddresses } from '@proton/shared/lib/helpers/address';
import { Address, UserModel } from '@proton/shared/lib/interfaces';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import { useGetOpenedMailEvents } from '../../hooks/useGetOpenedMailEvents';
import AlarmContainer from '../alarms/AlarmContainer';
import { CalendarsAlarmsCache } from '../alarms/CacheInterface';
import useCalendarsAlarmsEventListeners from '../alarms/useCalendarAlarmsEventListener';
import { getCalendarsAlarmsCache } from '../alarms/useCalendarsAlarms';
import CalendarContainer from './CalendarContainer';
import CalendarStartupModals from './CalendarStartupModals';
import EventActionContainer from './EventActionContainer';
import ShareInvitationContainer from './ShareInvitationContainer';
import getCalendarsEventCache from './eventStore/cache/getCalendarsEventCache';
import { CalendarsEventsCache } from './eventStore/interface';
import useCalendarsEventsEventListener from './eventStore/useCalendarsEventsEventListener';
import { EventTargetAction } from './interface';

interface Props {
    calendars: VisualCalendar[];
    addresses: Address[];
    user: UserModel;
    sideAppView?: VIEWS;
}

const MainContainerSetup = ({ user, addresses, calendars, sideAppView }: Props) => {
    const { isNarrow } = useActiveBreakpoint();
    const [userSettings] = useUserSettings();
    const [calendarUserSettings = DEFAULT_CALENDAR_USER_SETTINGS] = useCalendarUserSettings();

    const { activeCalendars, visibleCalendars, allCalendarIDs } = useMemo(() => {
        return {
            calendars,
            activeCalendars: getProbablyActiveCalendars(calendars),
            visibleCalendars: calendars.filter(({ Display }) => !!Display),
            allCalendarIDs: calendars.map(({ ID }) => ID),
        };
    }, [calendars]);

    useCalendarsInfoListener(allCalendarIDs);

    const getOpenedMailEvents = useGetOpenedMailEvents(sideAppView);
    const calendarsEventsCacheRef = useRef<CalendarsEventsCache>(getCalendarsEventCache());
    useCalendarsEventsEventListener(calendarsEventsCacheRef, allCalendarIDs, getOpenedMailEvents);

    const calendarAlarmsCacheRef = useRef<CalendarsAlarmsCache>(getCalendarsAlarmsCache());
    useCalendarsAlarmsEventListeners(calendarAlarmsCacheRef, allCalendarIDs);

    const eventTargetActionRef = useRef<EventTargetAction>();
    const shareCalendarInvitationRef = useRef<{ calendarID: string; invitationID: string }>();

    const activeAddresses = useMemo(() => {
        return getActiveAddresses(addresses);
    }, [addresses]);

    const defaultCalendar = getDefaultCalendar(activeCalendars, calendarUserSettings.DefaultCalendarID);

    const [localTzid] = useState(() => getTimezone());
    const [customTzid, setCustomTzid] = useState('');
    const defaultTzid = getDefaultTzid(calendarUserSettings, localTzid);

    // In the side app the time zone selector won't be visible. We want to force using the browser time zone
    // We have to do it here, so that we use the correct timezone in EventActionContainer and in CalendarContainer
    const tzid = sideAppView ? getTimezone() : customTzid || defaultTzid;

    const [startupModalState, setStartupModalState] = useState<{ hasModal?: boolean; isOpen: boolean }>({
        isOpen: false,
    });

    return (
        <ContactEmailsProvider>
            <CalendarStartupModals setStartupModalState={setStartupModalState} />
            <Switch>
                <Route path={['/:appName/event', '/event']}>
                    <EventActionContainer
                        sideAppView={sideAppView}
                        tzid={tzid}
                        addresses={addresses}
                        calendars={calendars}
                        eventTargetActionRef={eventTargetActionRef}
                    />
                </Route>
                <Route path={'/share'}>
                    <ShareInvitationContainer shareCalendarInvitationRef={shareCalendarInvitationRef} />
                </Route>
                <Route path="/">
                    <CalendarContainer
                        tzid={tzid}
                        setCustomTzid={setCustomTzid}
                        isNarrow={isNarrow}
                        sideAppView={sideAppView}
                        user={user}
                        addresses={addresses}
                        activeAddresses={activeAddresses}
                        visibleCalendars={visibleCalendars}
                        activeCalendars={activeCalendars}
                        calendars={calendars}
                        defaultCalendar={defaultCalendar}
                        calendarsEventsCacheRef={calendarsEventsCacheRef}
                        calendarUserSettings={calendarUserSettings}
                        userSettings={userSettings}
                        eventTargetActionRef={eventTargetActionRef}
                        shareCalendarInvitationRef={shareCalendarInvitationRef}
                        startupModalState={startupModalState}
                        getOpenedMailEvents={getOpenedMailEvents}
                    />
                </Route>
                <Redirect to="/" />
            </Switch>
            <AlarmContainer
                calendars={visibleCalendars}
                tzid={tzid}
                calendarsEventsCacheRef={calendarsEventsCacheRef}
                calendarsAlarmsCacheRef={calendarAlarmsCacheRef}
            />
        </ContactEmailsProvider>
    );
};

export default MainContainerSetup;
