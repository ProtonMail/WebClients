import React from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { ErrorBoundary, StandardPrivateApp } from 'react-components';
import { UserModel, MailSettingsModel, UserSettingsModel } from 'proton-shared/lib/models';

import Home from './containers/Home';
import About from './containers/About';
import PrivateLayout from './components/layout/PrivateLayout';

const PrivateApp = ({ onLogout }) => {
    return (
        <StandardPrivateApp
            onLogout={onLogout}
            preloadModels={[UserModel, UserSettingsModel]}
            eventModels={[UserModel, MailSettingsModel]}
        >
            <PrivateLayout>
                <Route
                    render={({ location }) => (
                        <ErrorBoundary key={location.key}>
                            <Switch>
                                <Route path="/" exact component={Home} />
                                <Route path="/about" exact component={About} />
                                <Route component={NotFoundContainer} />
                            </Switch>
                        </ErrorBoundary>
                    )}
                />
            </PrivateLayout>
        </StandardPrivateApp>
    );
};

PrivateApp.propTypes = {
    onLogout: PropTypes.func.isRequired
};

export default PrivateApp;
