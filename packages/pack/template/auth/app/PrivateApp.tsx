import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { ErrorBoundary, StandardPrivateApp } from 'react-components';
import { UserModel, MailSettingsModel, UserSettingsModel } from 'proton-shared/lib/models';

import Home from './containers/Home';
import About from './containers/About';
import PrivateLayout from './components/layout/PrivateLayout';

const NotFoundContainer = () => <h1>Not found</h1>;

interface Props {
    onLogout: () => void;
}

const PrivateApp = ({ onLogout }: Props) => {
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

export default PrivateApp;
