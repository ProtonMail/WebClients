import React from 'react';
import { Route, Redirect, Switch, useRouteMatch, useLocation } from 'react-router-dom';

import VpnDownloadSettings from './VpnDownloadSettings';
import VpnOpenVpnIKEv2Settings from './VpnOpenVpnIKEv2Settings';

const VpnSettingsRouter = () => {
    const { path } = useRouteMatch();
    const location = useLocation();

    return (
        <Switch>
            <Route path={`${path}/vpn-apps`}>
                <VpnDownloadSettings location={location} />
            </Route>
            <Route path={`${path}/open-vpn-ike-v2`}>
                <VpnOpenVpnIKEv2Settings location={location} />
            </Route>
            <Redirect to={`${path}/dashboard`} />
        </Switch>
    );
};

export default VpnSettingsRouter;
