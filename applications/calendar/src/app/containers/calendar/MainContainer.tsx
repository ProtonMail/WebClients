import React, { useState } from 'react';
import { Redirect, Route, Switch } from 'react-router';
import { useCalendars, useCalendarUserSettings, useUser } from 'react-components';

import SettingsContainer from '../settings/SettingsContainer';
import CalendarContainer from './CalendarContainer';
import { getSetupType, SETUP_TYPE } from '../setup/setupHelper';
import { DEFAULT_USER_SETTINGS } from '../../settingsConstants';
import FreeContainer from '../setup/FreeContainer';
import WelcomeContainer from '../setup/WelcomeContainer';
import { UserModel } from 'proton-shared/lib/interfaces';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';
import ResetContainer from '../setup/ResetContainer';

interface Props {
    calendars: Calendar[];
    user: UserModel;
}
const MainContainerSetup = ({ calendars = [], user }: Props) => {
    const [calendarUserSettings = DEFAULT_USER_SETTINGS] = useCalendarUserSettings();

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
                            user={user}
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

    return <MainContainerSetup calendars={calendars} user={user} />;
};

export default MainContainer;
