import React, { useState, useEffect } from 'react';

import { APPS, USER_SCOPES } from 'proton-shared/lib/constants';
import { hasScope } from 'proton-shared/lib/helpers/scope';

import useConfig from '../../containers/config/useConfig';
import MobileNavServices from './MobileNavServices';
import MobileNavLink from './MobileNavLink';
import { useUserScopes } from '../../hooks/useUserScopes';

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
            setLinks([...initalLinks, driveLink]);
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
