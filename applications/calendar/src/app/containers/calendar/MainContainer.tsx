import React, { useRef, useState } from 'react';
import { Redirect, Route, Switch } from 'react-router';
import { useCalendars, useCalendarUserSettings, useDelinquent, useUser } from 'react-components';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';

import SettingsContainer from '../settings/SettingsContainer';
import CalendarContainer from './CalendarContainer';
import { getSetupType, SETUP_TYPE } from '../setup/setupHelper';
import { DEFAULT_USER_SETTINGS } from '../../settingsConstants';
import FreeContainer from '../setup/FreeContainer';
import WelcomeContainer from '../setup/WelcomeContainer';
import ResetContainer from '../setup/ResetContainer';
import { CalendarsEventsCache } from './eventStore/interface';
import { getInitialCalendarEventCache } from './eventStore/useCalendarsEvents';
import { CalendarAlarmsCache } from '../alarms/CacheInterface';
import useCalendarsAlarmsEventListeners from '../alarms/useCalendarAlarmsEventListener';
import { getInitialCalendarsAlarmsCache } from '../alarms/useCalendarsAlarms';
import useCalendarsEventsEventListener from './eventStore/useCalendarsEventsEventListener';

interface Props {
    calendars: Calendar[];
}
const MainContainerSetup = ({ calendars = [] }: Props) => {
    const [calendarUserSettings = DEFAULT_USER_SETTINGS] = useCalendarUserSettings();

    const calendarsEventsCacheRef = useRef<CalendarsEventsCache>(getInitialCalendarEventCache());
    useCalendarsEventsEventListener(calendarsEventsCacheRef);

    const calendarAlarmsCacheRef = useRef<CalendarAlarmsCache>(getInitialCalendarsAlarmsCache());
    useCalendarsAlarmsEventListeners(calendarAlarmsCacheRef);

    return (
        <Switch>
            <Route
                path="/calendar/settings"
                render={() => {
                    return <SettingsContainer calendars={calendars} calendarUserSettings={calendarUserSettings} />;
                }}
            />
            <Route
                path="/calendar"
                render={({ history, location }) => {
                    return (
                        <CalendarContainer
                            calendarsEventsCacheRef={calendarsEventsCacheRef}
                            calendarsAlarmsCacheRef={calendarAlarmsCacheRef}
                            calendars={calendars}
                            calendarUserSettings={calendarUserSettings}
                            history={history}
                            location={location}
                        />
                    );
                }}
            />
            <Redirect to="/calendar" />
        </Switch>
    );
};

const MainContainer = () => {
    const [calendars] = useCalendars();
    const [user] = useUser();
    useDelinquent();

    const [setupType, setSetupType] = useState(() => getSetupType(calendars));

    if (user.isFree) {
        return <FreeContainer />;
    }

    if (setupType === SETUP_TYPE.WELCOME) {
        return <WelcomeContainer onDone={() => setSetupType(SETUP_TYPE.DONE)} />;
    }

    if (setupType === SETUP_TYPE.RESET) {
        return <ResetContainer calendars={calendars} onDone={() => setSetupType(SETUP_TYPE.DONE)} />;
    }

    return <MainContainerSetup calendars={calendars} />;
};

export default MainContainer;
