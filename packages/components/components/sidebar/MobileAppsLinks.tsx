import { APPS, APPS_CONFIGURATION, VPN_HOSTNAME } from '@proton/shared/lib/constants';

import { AppLink, Logo, VpnLogo } from '..';
import { useApps, useConfig } from '../../hooks';
import Href from '../link/Href';
import MobileNavServices from './MobileNavServices';

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
                        <Logo appName={toApp} variant="glyph-only" />
                    </AppLink>
                );
            })}
            <Href url={`https://${VPN_HOSTNAME}/login`} title={APPS_CONFIGURATION[APPS.PROTONVPN_SETTINGS].name}>
                <VpnLogo variant="glyph-only" />
            </Href>
        </MobileNavServices>
    );
};

export default MobileAppsLinks;
