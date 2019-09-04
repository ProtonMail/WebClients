import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { ErrorBoundary } from 'react-components';

import DashboardContainer from './containers/DashboardContainer';
import AccountContainer from './containers/AccountContainer';
import DownloadsContainer from './containers/DownloadsContainer';
import PaymentsContainer from './containers/PaymentsContainer';

const PrivateAppRoutes = () => {
    return (
        <Route
            render={({ location }) => (
                <ErrorBoundary key={location.pathname}>
                    <Switch>
                        <Route path="/dashboard" exact component={DashboardContainer} />
                        <Route path="/account" exact component={AccountContainer} />
                        <Route path="/downloads" exact component={DownloadsContainer} />
                        <Route path="/payments" exact component={PaymentsContainer} />
                        <Redirect to="/dashboard" />
                    </Switch>
                </ErrorBoundary>
            )}
        />
    );
};

export default PrivateAppRoutes;
