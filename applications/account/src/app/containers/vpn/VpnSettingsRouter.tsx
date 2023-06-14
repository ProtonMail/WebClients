import { ReactNode } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import {
    OpenVPNConfigurationSection,
    OpenVPNCredentialsSection,
    PrivateMainSettingsArea,
    ProtonVPNClientsSection,
    WireGuardConfigurationSection,
} from '@proton/components';
import { getSectionPath } from '@proton/components/containers/layout/helper';

import VpnUpgradeSection from './VpnUpgradeSection';
import type { getVpnAppRoutes } from './routes';

const VpnSettingsRouter = ({
    vpnAppRoutes,
    redirect,
}: {
    vpnAppRoutes: ReturnType<typeof getVpnAppRoutes>;
    redirect?: ReactNode;
}) => {
    const { path } = useRouteMatch();

    const {
        routes: { downloads, openvpn, wireguard },
    } = vpnAppRoutes;

    return (
        <Switch>
            <Route path={getSectionPath(path, downloads)}>
                <PrivateMainSettingsArea config={downloads}>
                    <VpnUpgradeSection />
                    <ProtonVPNClientsSection />
                </PrivateMainSettingsArea>
            </Route>
            <Route path={getSectionPath(path, openvpn)}>
                <PrivateMainSettingsArea config={openvpn}>
                    <OpenVPNCredentialsSection app="account" />
                    <OpenVPNConfigurationSection />
                </PrivateMainSettingsArea>
            </Route>
            <Route path={getSectionPath(path, wireguard)}>
                <PrivateMainSettingsArea config={wireguard}>
                    <WireGuardConfigurationSection />
                </PrivateMainSettingsArea>
            </Route>
            {redirect}
        </Switch>
    );
};

export default VpnSettingsRouter;
