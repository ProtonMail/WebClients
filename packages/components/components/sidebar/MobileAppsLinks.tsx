import { APPS_CONFIGURATION, VPN_HOSTNAME } from '@proton/shared/lib/constants';

import { useConfig, useApps } from '../../hooks';
import MobileNavServices from './MobileNavServices';
import Href from '../link/Href';
import Icon from '../icon/Icon';
import MobileNavLink from './MobileNavLink';

const MobileAppsLinks = () => {
    const { APP_NAME } = useConfig();
    const applications = useApps();
    const apps = applications.map((app) => ({
        toApp: app,
        icon: APPS_CONFIGURATION[app].icon,
        title: APPS_CONFIGURATION[app].name,
    }));

    return (
        <MobileNavServices>
            {apps.map(({ toApp, icon }, index) => {
                const isCurrent = toApp === APP_NAME;
                return <MobileNavLink key={index} to="/" toApp={toApp} icon={icon} current={isCurrent} />;
            })}
            <Href url={`https://${VPN_HOSTNAME}/login`} className="flex aside-link">
                <Icon name="brand-proton-vpn" className="aside-link-icon mauto" />
            </Href>
        </MobileNavServices>
    );
};

export default MobileAppsLinks;
