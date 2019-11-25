import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
    EventManagerProvider,
    EventModelListener,
    EventNotices,
    ErrorBoundary,
    LoaderPage,
    ThemeInjector,
    ModalsChildren
} from 'react-components';
import { c } from 'ttag';
import {
    UserModel,
    UserSettingsModel,
    CalendarsModel,
    CalendarUserSettingsModel,
    AddressesModel
} from 'proton-shared/lib/models';
import { Redirect, Route, Switch } from 'react-router';

import CalendarContainer from '../containers/calendar/CalendarContainer';
import SettingsContainer from '../containers/settings/SettingsContainer';
import CalendarSetupContainer from '../containers/setup/CalendarSetupContainer';
import CalendarPreload from './CalendarPreload';

const EVENT_MODELS = [UserModel, UserSettingsModel, CalendarsModel, CalendarUserSettingsModel, AddressesModel];

const PRELOAD_MODELS = [UserSettingsModel, UserModel, AddressesModel, CalendarsModel];

const PrivateApp = ({ onLogout }) => {
    const [loading, setLoading] = useState(true);
    const eventManagerRef = useRef();

    if (loading) {
        return (
            <>
                <CalendarPreload
                    locales={{}}
                    preloadModels={PRELOAD_MODELS}
                    onSuccess={(ev) => {
                        eventManagerRef.current = ev;
                        setLoading(false);
                    }}
                    onError={onLogout}
                />
                <ModalsChildren />
                <LoaderPage text={c('Info').t`Loading ProtonCalendar`} />
            </>
        );
    }

    return (
        <EventManagerProvider eventManager={eventManagerRef.current}>
            <ModalsChildren />
            <EventModelListener models={EVENT_MODELS} />
            <EventNotices />
            <ThemeInjector />
            <ErrorBoundary>
                <CalendarSetupContainer>
                    <Switch>
                        <Route path="/calendar/settings" component={SettingsContainer} />
                        <Route
                            path="/calendar"
                            render={({ history, location }) => {
                                return <CalendarContainer history={history} location={location} />;
                            }}
                        />
                        <Redirect to="/calendar" />
                    </Switch>
                </CalendarSetupContainer>
            </ErrorBoundary>
        </EventManagerProvider>
    );
};

PrivateApp.propTypes = {
    onLogout: PropTypes.func.isRequired
};

export default PrivateApp;
