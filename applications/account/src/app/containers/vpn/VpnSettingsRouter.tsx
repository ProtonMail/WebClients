import React from 'react';
import { Route, Redirect, Switch, useRouteMatch, useLocation } from 'react-router-dom';

import VpnDownloadSettings from './VpnDownloadSettings';
import VpnOpenVpnIKEv2 from './VpnOpenVpnIKEv2';

const VpnSettingsRouter = () => {
    const { path } = useRouteMatch();
    const location = useLocation();

    return (
        <Switch>
            <Route path={`${path}/downloads`}>
                <VpnDownloadSettings location={location} />
            </Route>
            <Route path={`${path}/OpenVpnIKEv2`}>
                <VpnOpenVpnIKEv2 location={location} />
            </Route>
            <Redirect to={`${path}/dashboard`} />
        </Switch>
    );
};

export default VpnSettingsRouter;
