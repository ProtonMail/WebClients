import { getDefaultTzid } from '@proton/shared/lib/calendar/getSettings';
import { useMemo, useRef, useState } from 'react';
import { Redirect, Route, Switch } from 'react-router';
import {
    useActiveBreakpoint,
    useCalendarsInfoListener,
    useCalendarUserSettings,
    useUserSettings,
} from '@proton/components';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import { Address, UserModel } from '@proton/shared/lib/interfaces';
import {
    DEFAULT_CALENDAR_USER_SETTINGS,
    getDefaultCalendar,
    getProbablyActiveCalendars,
} from '@proton/shared/lib/calendar/calendar';
import { getTimezone } from '@proton/shared/lib/date/timezone';
import { getActiveAddresses } from '@proton/shared/lib/helpers/address';
import { VIEWS } from '@proton/shared/lib/calendar/constants';
import { useGetOpenedMailEvents } from '../../hooks/useGetOpenedMailEvents';

import { CalendarsEventsCache } from './eventStore/interface';
import getCalendarsEventCache from './eventStore/cache/getCalendarsEventCache';
import useCalendarsEventsEventListener from './eventStore/useCalendarsEventsEventListener';
import { CalendarsAlarmsCache } from '../alarms/CacheInterface';
import { getCalendarsAlarmsCache } from '../alarms/useCalendarsAlarms';
import useCalendarsAlarmsEventListeners from '../alarms/useCalendarAlarmsEventListener';
import CalendarContainer from './CalendarContainer';
import AlarmContainer from '../alarms/AlarmContainer';
import EventActionContainer from './EventActionContainer';
import { EventTargetAction } from './interface';
import CalendarStartupModals from './CalendarStartupModals';

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

    return (
        <>
            <CalendarStartupModals />
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
        </>
    );
};

export default MainContainerSetup;
