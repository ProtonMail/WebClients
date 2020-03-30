import React, { useState, useEffect } from 'react';

import { APPS } from 'proton-shared/lib/constants';

import { useUserScopes, hasScope, USER_SCOPES } from '../../hooks/useUserScopes';
import useConfig from '../../containers/config/useConfig';
import MobileNavServices from './MobileNavServices';
import MobileNavLink from './MobileNavLink';

const { PROTONMAIL, PROTONCONTACTS, PROTONMAIL_SETTINGS, PROTONCALENDAR, PROTONDRIVE } = APPS;

const MobileAppsLinks = () => {
    const { APP_NAME } = useConfig();
    const [userScopes, loadingUserScopes] = useUserScopes();

    const driveLink = { appNames: [PROTONDRIVE], to: '/drive', icon: 'protondrive' };
    const initalLinks = [
        { appNames: [PROTONMAIL, PROTONMAIL_SETTINGS], to: '/inbox', icon: 'protonmail' },
        { appNames: [PROTONCONTACTS], to: '/contacts', icon: 'protoncontacts' },
        { appNames: [PROTONCALENDAR], to: '/calendar', icon: 'protoncalendar' }
    ];

    const [links, setLinks] = useState(initalLinks);

    useEffect(() => {
        if (!loadingUserScopes && hasScope(userScopes, USER_SCOPES.DRIVE)) {
            setLinks([...links, driveLink]);
        }
    }, [userScopes, loadingUserScopes]);

    return (
        <MobileNavServices>
            {links.map(({ appNames, to, icon }, index) => {
                const isCurrent = appNames.includes(APP_NAME);
                return <MobileNavLink key={index} to={to} icon={icon} external={!isCurrent} current={isCurrent} />;
            })}
        </MobileNavServices>
    );
};

export default MobileAppsLinks;
