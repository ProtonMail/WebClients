import React from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import { ErrorBoundary, StandardPrivateApp } from 'react-components';
import { UserModel } from 'proton-shared/lib/models';

import Drive from './containers/Drive';
import PrivateLayout from './components/layout/PrivateLayout';

interface Props {
    onLogout: () => void;
}

const PrivateApp = ({ onLogout }: Props) => {
    return (
        <StandardPrivateApp onLogout={onLogout} preloadModels={[UserModel]} eventModels={[UserModel]}>
            <PrivateLayout>
                <Route
                    render={({ location }) => (
                        <ErrorBoundary key={location.key}>
                            <Switch>
                                <Route path="/drive" exact component={Drive} />
                                <Redirect to="/drive" />
                            </Switch>
                        </ErrorBoundary>
                    )}
                />
            </PrivateLayout>
        </StandardPrivateApp>
    );
};

export default PrivateApp;
