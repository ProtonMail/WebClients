import React from 'react';
import { c } from 'ttag';
import { APPS, APPS_CONFIGURATION, FEATURE_FLAGS, isSSOMode } from 'proton-shared/lib/constants';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { getAccountSettingsApp } from 'proton-shared/lib/apps/helper';
import humanSize from 'proton-shared/lib/helpers/humanSize';

import { useUser } from '../../hooks';
import { Meter, AppLink, Icon, SimpleDropdown } from '../../components';

const { PROTONACCOUNT, PROTONMAIL, PROTONCONTACTS, PROTONCALENDAR, PROTONDRIVE } = APPS;

const AppsDropdown = () => {
    const [user] = useUser();
    const { UsedSpace, MaxSpace } = user;
    const spacePercentage = Math.round((UsedSpace * 100) / MaxSpace);
    const spaceHuman = `${humanSize(UsedSpace)} / ${humanSize(MaxSpace)}`;

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
        <SimpleDropdown
            hasCaret={false}
            content={<Icon name="more" className="appsDropdown-button-icon flex-item-noshrink" />}
            className="appsDropdown-button"
            dropdownClassName="appsDropdown-container"
            originalPlacement="bottom-right"
            title={c('Apps dropdown').t`Proton applications`}
        >
            <ul className="appsDropdown-list unstyled m0 scroll-if-needed">
                {apps.map(({ toApp, icon, title }, index) => {
                    const key = `${index}`;
                    return (
                        <li className="dropDown-item appsDropdown-item" key={key}>
                            <AppLink
                                to="/"
                                toApp={toApp}
                                className="appsDropdown-link big m0 p1 pt0-75 pb0-75 flex flex-nowrap flex-items-center"
                                title={c('Apps dropdown').t`Go to ${title}`}
                            >
                                <Icon name={icon} size={20} className="mr0-5" />
                                <span>{title}</span>
                            </AppLink>
                        </li>
                    );
                })}
                <li className="dropDown-item appsDropdown-item">
                    <AppLink
                        to="/subscription"
                        toApp={getAccountSettingsApp()}
                        className="appsDropdown-link big m0 bl p1 pt0-75 pb0-25"
                        title={c('Apps dropdown').t`Add storage space`}
                    >
                        <span className="flex flex-nowrap flex-items-center">
                            <Icon name="user-storage" size={20} className="mr0-5" />
                            <span>{c('Apps dropdown').t`Storage capacity`}</span>
                        </span>
                        <div className="ml1-5">
                            <Meter className="is-thin bl mt0-25" value={spacePercentage} />
                            <div className="smaller m0 opacity-50">{spaceHuman}</div>
                        </div>
                    </AppLink>
                </li>
            </ul>
        </SimpleDropdown>
    );
};

export default AppsDropdown;
