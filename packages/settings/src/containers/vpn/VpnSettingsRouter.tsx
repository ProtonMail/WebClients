import type { ReactNode } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import PrivateMainSettingsArea from '@proton/components/containers/layout/PrivateMainSettingsArea';
import { getSectionPath } from '@proton/components/containers/layout/helper';
import { VPN_TV_PATHS } from '@proton/shared/lib/constants';
import OpenVPNConfigurationSection from '@proton/vpn/components/OpenVPNConfigurationSection';
import OpenVPNCredentialsSection from '@proton/vpn/components/OpenVPNCredentialsSection';
import { VPNClientsSection } from '@proton/vpn/components/VPNClientsSection';
import WireGuardConfigurationSection from '@proton/vpn/components/WireGuardConfigurationSection';
import { TVContainer } from '@proton/vpn/components/tv/containers/TVContainer';

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
            <Route path={VPN_TV_PATHS.map((pathname) => `${path}${pathname}`)}>
                <TVContainer />
            </Route>
            <Route path={getSectionPath(path, downloads)}>
                <PrivateMainSettingsArea config={downloads}>
                    <VpnUpgradeSection />
                    <VPNClientsSection />
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
