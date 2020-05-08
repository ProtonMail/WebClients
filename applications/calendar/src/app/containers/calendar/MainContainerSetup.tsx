import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Redirect, Route, Switch } from 'react-router';
import { useActiveBreakpoint, useCalendarUserSettings } from 'react-components';
import { Calendar, SETTINGS_TIME_FORMAT } from 'proton-shared/lib/interfaces/calendar';
import { Address } from 'proton-shared/lib/interfaces';
import updateLongLocale from 'proton-shared/lib/i18n/updateLongLocale';
import {
    getDefaultCalendar,
    getIsCalendarDisabled,
    getProbablyActiveCalendars
} from 'proton-shared/lib/calendar/calendar';
import { getTimezone } from 'proton-shared/lib/date/timezone';

import { DEFAULT_USER_SETTINGS } from '../../settingsConstants';
import { CalendarsEventsCache } from './eventStore/interface';
import { getCalendarsEventCache } from './eventStore/useCalendarsEvents';
import useCalendarsEventsEventListener from './eventStore/useCalendarsEventsEventListener';
import { CalendarsAlarmsCache } from '../alarms/CacheInterface';
import { getCalendarsAlarmsCache } from '../alarms/useCalendarsAlarms';
import useCalendarsAlarmsEventListeners from '../alarms/useCalendarAlarmsEventListener';
import { getDefaultTzid } from './getSettings';
import SettingsContainer from '../settings/SettingsContainer';
import CalendarContainer from './CalendarContainer';
import AlarmContainer from '../alarms/AlarmContainer';

interface Props {
    calendars: Calendar[];
    addresses: Address[];
}
const MainContainerSetup = ({ addresses, calendars }: Props) => {
    const { isNarrow } = useActiveBreakpoint();

    const [calendarUserSettings = DEFAULT_USER_SETTINGS] = useCalendarUserSettings();

    useEffect(() => {
        updateLongLocale({ displayAMPM: calendarUserSettings.TimeFormat === SETTINGS_TIME_FORMAT.H12 });
    }, [calendarUserSettings]);

    const calendarsEventsCacheRef = useRef<CalendarsEventsCache>(getCalendarsEventCache());
    useCalendarsEventsEventListener(calendarsEventsCacheRef);

    const calendarAlarmsCacheRef = useRef<CalendarsAlarmsCache>(getCalendarsAlarmsCache());
    useCalendarsAlarmsEventListeners(calendarAlarmsCacheRef);

    const { activeCalendars, disabledCalendars, visibleCalendars } = useMemo(() => {
        return {
            calendars,
            activeCalendars: getProbablyActiveCalendars(calendars),
            disabledCalendars: calendars.filter((calendar) => getIsCalendarDisabled(calendar)),
            visibleCalendars: calendars.filter(({ Display }) => !!Display)
        };
    }, [calendars]);

    const defaultCalendar = getDefaultCalendar(activeCalendars, calendarUserSettings.DefaultCalendarID);

    const [localTzid] = useState(() => getTimezone());
    const [customTzid, setCustomTzid] = useState('');
    const defaultTzid = getDefaultTzid(calendarUserSettings, localTzid);
    const tzid = customTzid || defaultTzid;

    return (
        <>
            <Switch>
                <Route
                    path="/calendar/settings"
                    render={() => {
                        return (
                            <SettingsContainer
                                isNarrow={isNarrow}
                                addresses={addresses}
                                calendars={calendars}
                                activeCalendars={activeCalendars}
                                disabledCalendars={disabledCalendars}
                                defaultCalendar={defaultCalendar}
                                calendarUserSettings={calendarUserSettings}
                            />
                        );
                    }}
                />
                <Route
                    path="/calendar"
                    render={({ history, location }) => {
                        return (
                            <CalendarContainer
                                tzid={tzid}
                                setCustomTzid={setCustomTzid}
                                isNarrow={isNarrow}
                                addresses={addresses}
                                visibleCalendars={visibleCalendars}
                                activeCalendars={activeCalendars}
                                disabledCalendars={disabledCalendars}
                                defaultCalendar={defaultCalendar}
                                calendarsEventsCacheRef={calendarsEventsCacheRef}
                                calendarUserSettings={calendarUserSettings}
                                history={history}
                                location={location}
                            />
                        );
                    }}
                />
                <Redirect to="/calendar" />
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
