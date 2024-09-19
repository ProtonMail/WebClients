import type { ReactNode } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import {
    OpenVPNConfigurationSection,
    OpenVPNCredentialsSection,
    PrivateMainSettingsArea,
    ProtonVPNClientsSection,
    TVContainer,
    WireGuardConfigurationSection,
} from '@proton/components';
import { getSectionPath } from '@proton/components/containers/layout/helper';
import { VPN_TV_PATHS } from '@proton/shared/lib/constants';

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
                <TVContainer background={false} />
            </Route>
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
