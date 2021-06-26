import { getIsPersonalCalendar } from '@proton/shared/lib/calendar/subscribe/helpers';
import { unary } from '@proton/shared/lib/helpers/function';
import React, { useMemo, useRef, useState } from 'react';
import { Redirect, Route, Switch } from 'react-router';
import {
    useActiveBreakpoint,
    useCalendarsKeysSettingsListener,
    useCalendarUserSettings,
    useUserSettings,
} from '@proton/components';
import { Calendar } from '@proton/shared/lib/interfaces/calendar';
import { Address, UserModel } from '@proton/shared/lib/interfaces';
import {
    DEFAULT_CALENDAR_USER_SETTINGS,
    getDefaultCalendar,
    getProbablyActiveCalendars,
} from '@proton/shared/lib/calendar/calendar';
import { getTimezone } from '@proton/shared/lib/date/timezone';
import { getActiveAddresses } from '@proton/shared/lib/helpers/address';

import { CalendarsEventsCache } from './eventStore/interface';
import getCalendarsEventCache from './eventStore/cache/getCalendarsEventCache';
import useCalendarsEventsEventListener from './eventStore/useCalendarsEventsEventListener';
import { CalendarsAlarmsCache } from '../alarms/CacheInterface';
import { getCalendarsAlarmsCache } from '../alarms/useCalendarsAlarms';
import useCalendarsAlarmsEventListeners from '../alarms/useCalendarAlarmsEventListener';
import { getDefaultTzid } from './getSettings';
import CalendarContainer from './CalendarContainer';
import AlarmContainer from '../alarms/AlarmContainer';
import EventActionContainer from './EventActionContainer';
import { EventTargetAction } from './interface';

interface Props {
    calendars: Calendar[];
    addresses: Address[];
    user: UserModel;
}
const MainContainerSetup = ({ user, addresses, calendars }: Props) => {
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

    useCalendarsKeysSettingsListener(allCalendarIDs);

    const calendarsEventsCacheRef = useRef<CalendarsEventsCache>(getCalendarsEventCache());
    useCalendarsEventsEventListener(calendarsEventsCacheRef, allCalendarIDs);

    const calendarAlarmsCacheRef = useRef<CalendarsAlarmsCache>(getCalendarsAlarmsCache());
    useCalendarsAlarmsEventListeners(calendarAlarmsCacheRef, allCalendarIDs);

    const eventTargetActionRef = useRef<EventTargetAction>();
    const activeAddresses = useMemo(() => {
        return getActiveAddresses(addresses);
    }, [addresses]);

    const defaultCalendar = getDefaultCalendar(
        activeCalendars.filter(unary(getIsPersonalCalendar)),
        calendarUserSettings.DefaultCalendarID
    );

    const [localTzid] = useState(() => getTimezone());
    const [customTzid, setCustomTzid] = useState('');
    const defaultTzid = getDefaultTzid(calendarUserSettings, localTzid);
    const tzid = customTzid || defaultTzid;

    return (
        <>
            <Switch>
                <Route path="/event">
                    <EventActionContainer
                        tzid={tzid}
                        calendars={calendars}
                        eventTargetActionRef={eventTargetActionRef}
                    />
                </Route>
                <Route path="/">
                    <CalendarContainer
                        tzid={tzid}
                        setCustomTzid={setCustomTzid}
                        isNarrow={isNarrow}
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
