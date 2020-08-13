import React from 'react';

import { APPS, APPS_CONFIGURATION, FEATURE_FLAGS, isSSOMode } from 'proton-shared/lib/constants';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';

import { useConfig } from '../../hooks';
import MobileNavServices from './MobileNavServices';
import MobileNavLink from './MobileNavLink';

const { PROTONMAIL, PROTONCONTACTS, PROTONCALENDAR, PROTONDRIVE, PROTONACCOUNT } = APPS;

const MobileAppsLinks = () => {
    const { APP_NAME } = useConfig();

    const apps = [
        PROTONMAIL,
        PROTONCONTACTS,
        PROTONCALENDAR,
        FEATURE_FLAGS.includes('drive') && PROTONDRIVE,
        isSSOMode && PROTONACCOUNT,
    ]
        .filter(isTruthy)
        .map((app) => ({
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
        </MobileNavServices>
    );
};

export default MobileAppsLinks;
