import { APPS, APPS_CONFIGURATION, VPN_HOSTNAME } from '@proton/shared/lib/constants';

import { useConfig, useApps } from '../../hooks';
import MobileNavServices from './MobileNavServices';
import Href from '../link/Href';
import { AppLink, Logo, VpnLogo } from '..';

const MobileAppsLinks = () => {
    const { APP_NAME } = useConfig();
    const applications = useApps();
    const apps = applications.map((app) => ({
        toApp: app,
        title: APPS_CONFIGURATION[app].name,
    }));

    return (
        <MobileNavServices>
            {apps.map(({ toApp, title }) => {
                const isCurrent = toApp === APP_NAME;
                return (
                    <AppLink key={toApp} to="/" toApp={toApp} target="_self" title={title} aria-current={isCurrent}>
                        <Logo appName={toApp} variant="standalone" />
                    </AppLink>
                );
            })}
            <Href url={`https://${VPN_HOSTNAME}/login`} title={APPS_CONFIGURATION[APPS.PROTONVPN_SETTINGS].name}>
                <VpnLogo variant="standalone" />
            </Href>
        </MobileNavServices>
    );
};

export default MobileAppsLinks;
