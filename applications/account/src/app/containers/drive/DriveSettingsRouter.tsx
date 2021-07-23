import React from 'react';
import { Route, Redirect, Switch, useRouteMatch, useLocation } from 'react-router-dom';

import DriveGeneralSettings from './DriveGeneralSettings';

const DriveSettingsRouter = () => {
    const { path } = useRouteMatch();
    const location = useLocation();

    return (
        <Switch>
            <Route path={`${path}/general`}>
                <DriveGeneralSettings location={location} />
            </Route>
            <Redirect to={`${path}/dashboard`} />
        </Switch>
    );
};

export default DriveSettingsRouter;
