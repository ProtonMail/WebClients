import React from 'react';

import { APPS, FEATURE_FLAGS } from 'proton-shared/lib/constants';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';

import useConfig from '../../containers/config/useConfig';
import MobileNavServices from './MobileNavServices';
import MobileNavLink from './MobileNavLink';

const { PROTONMAIL, PROTONCONTACTS, PROTONMAIL_SETTINGS, PROTONCALENDAR, PROTONDRIVE } = APPS;

const MobileAppsLinks = () => {
    const { APP_NAME } = useConfig();

    const apps = [
        { appNames: [PROTONMAIL, PROTONMAIL_SETTINGS], to: '/inbox', icon: 'protonmail' },
        { appNames: [PROTONCONTACTS], to: '/contacts', icon: 'protoncontacts' },
        { appNames: [PROTONCALENDAR], to: '/calendar', icon: 'protoncalendar' },
        FEATURE_FLAGS.includes('drive') && { appNames: [PROTONDRIVE], to: '/drive', icon: 'protondrive' },
    ].filter(isTruthy);

    return (
        <MobileNavServices>
            {apps.map(({ appNames, to, icon }, index) => {
                const isCurrent = appNames.includes(APP_NAME);
                return (
                    <MobileNavLink
                        key={index}
                        to={to}
                        icon={icon}
                        external={appNames[0] !== APP_NAME}
                        current={isCurrent}
                    />
                );
            })}
        </MobileNavServices>
    );
};

export default MobileAppsLinks;
