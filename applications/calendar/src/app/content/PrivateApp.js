import React from 'react';
import PropTypes from 'prop-types';
import { ErrorBoundary, StandardPrivateApp } from 'react-components';
import { UserModel, UserSettingsModel, CalendarsModel } from 'proton-shared/lib/models';
import { Route, Switch } from 'react-router';

import CalendarContainer from '../containers/CalendarContainer';
import SettingsContainer from '../containers/SettingsContainer';

const EVENT_MODELS = [UserModel, UserSettingsModel, CalendarsModel];

const PRELOAD_MODELS = [UserSettingsModel, UserModel];

const PrivateApp = ({ onLogout }) => {
    return (
        <StandardPrivateApp
            onLogout={onLogout}
            locales={{} /* todo */}
            preloadModels={PRELOAD_MODELS}
            eventModels={EVENT_MODELS}
        >
            <ErrorBoundary>
                <Switch>
                    <Route path="/calendar/settings" component={SettingsContainer} />
                    <Route path="/calendar" component={CalendarContainer} />
                </Switch>
            </ErrorBoundary>
        </StandardPrivateApp>
    );
};

PrivateApp.propTypes = {
    onLogout: PropTypes.func.isRequired
};

export default PrivateApp;
