import { ReactNode } from 'react';
import { Route, Switch, useRouteMatch, useLocation } from 'react-router-dom';
import {
    OpenVPNConfigurationSection,
    OpenVPNCredentialsSection,
    PrivateMainSettingsArea,
    ProtonVPNClientsSection,
    ThemesSection,
    WireGuardConfigurationSection,
} from '@proton/components';
import { getSectionPath } from '@proton/components/containers/layout/helper';

import VpnUpgradeSection from './VpnUpgradeSection';
import { getVpnAppRoutes } from './routes';

const VpnSettingsRouter = ({
    vpnAppRoutes,
    redirect,
}: {
    vpnAppRoutes: ReturnType<typeof getVpnAppRoutes>;
    redirect?: ReactNode;
}) => {
    const { path } = useRouteMatch();
    const location = useLocation();

    const {
        routes: { general, downloads, openvpn, wireguard },
    } = vpnAppRoutes;

    return (
        <Switch>
            <Route path={getSectionPath(path, general)}>
                <PrivateMainSettingsArea location={location} config={general}>
                    <ThemesSection />
                </PrivateMainSettingsArea>
            </Route>
            <Route path={getSectionPath(path, downloads)}>
                <PrivateMainSettingsArea location={location} config={downloads}>
                    <VpnUpgradeSection />
                    <ProtonVPNClientsSection />
                </PrivateMainSettingsArea>
            </Route>
            <Route path={getSectionPath(path, openvpn)}>
                <PrivateMainSettingsArea location={location} config={openvpn}>
                    <OpenVPNCredentialsSection app="account" />
                    <OpenVPNConfigurationSection />
                </PrivateMainSettingsArea>
            </Route>
            <Route path={getSectionPath(path, wireguard)}>
                <PrivateMainSettingsArea location={location} config={wireguard}>
                    <WireGuardConfigurationSection />
                </PrivateMainSettingsArea>
            </Route>
            {redirect}
        </Switch>
    );
};

export default VpnSettingsRouter;
