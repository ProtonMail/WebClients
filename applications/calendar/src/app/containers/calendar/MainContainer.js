import React from 'react';
import { Redirect, Route, Switch } from 'react-router';
import { useCalendars, useUser } from 'react-components';

import CalendarSetupContainer from '../setup/CalendarSetupContainer';
import SettingsContainer from '../settings/SettingsContainer';
import CalendarContainer from './CalendarContainer';

const MainContainer = () => {
    const [calendars] = useCalendars();
    const [user] = useUser();

    return (
        <CalendarSetupContainer calendars={calendars} user={user}>
            <Switch>
                <Route
                    path="/calendar/settings"
                    render={() => {
                        return <SettingsContainer calendars={calendars} />;
                    }}
                />
                <Route
                    path="/calendar"
                    render={({ history, location }) => {
                        return <CalendarContainer calendars={calendars} history={history} location={location} />;
                    }}
                />
                <Redirect to="/calendar" />
            </Switch>
        </CalendarSetupContainer>
    );
};

export default MainContainer;
