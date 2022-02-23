import { APPS, APPS_CONFIGURATION, VPN_HOSTNAME } from '@proton/shared/lib/constants';

import { useConfig, useApps } from '../../hooks';
import MobileNavServices from './MobileNavServices';
import Href from '../link/Href';
import { Logo, VpnLogo } from '..';

const MobileAppsLinks = () => {
    const { APP_NAME } = useConfig();
    const applications = useApps();
    const apps = applications.map((app) => ({
        toApp: app,
        title: APPS_CONFIGURATION[app].name,
    }));

    return (
        <MobileNavServices>
            {apps.map(({ toApp, title }, index) => {
                const isCurrent = toApp === APP_NAME;
                return (
                    <Logo
                        key={index}
                        appName={toApp}
                        to="/"
                        toApp={toApp}
                        title={title}
                        version="standalone"
                        current={isCurrent}
                    />
                );
            })}
            <Href url={`https://${VPN_HOSTNAME}/login`} title={APPS_CONFIGURATION[APPS.PROTONVPN_SETTINGS].name}>
                <VpnLogo version="standalone" />
            </Href>
        </MobileNavServices>
    );
};

export default MobileAppsLinks;
