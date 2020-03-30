import React, { useState, useEffect } from 'react';
import { ReactNodeArray } from 'prop-types';

import { APPS, USER_SCOPES } from 'proton-shared/lib/constants';
import { hasScope } from 'proton-shared/lib/helpers/scope';

import { useUserScopes } from '../../hooks/useUserScopes';
import useConfig from '../config/useConfig';
import Tooltip from '../../components/tooltip/Tooltip';
import Link from '../../components/link/Link';
import Icon from '../../components/icon/Icon';

const { PROTONMAIL, PROTONCONTACTS, PROTONMAIL_SETTINGS, PROTONCALENDAR, PROTONDRIVE } = APPS;

interface Props {
    items: ReactNodeArray;
}

const AppsSidebar = ({ items = [] }: Props) => {
    const { APP_NAME } = useConfig();
    const [userScopes, loadingUserScopes] = useUserScopes();

    const driveApp = {
        appNames: [PROTONDRIVE],
        icon: 'protondrive',
        title: 'ProtonDrive',
        link: '/drive'
    };
    const initialApps = [
        { appNames: [PROTONMAIL, PROTONMAIL_SETTINGS], icon: 'protonmail', title: 'ProtonMail', link: '/inbox' },
        { appNames: [PROTONCONTACTS], icon: 'protoncontacts', title: 'ProtonContacts', link: '/contacts' },
        {
            appNames: [PROTONCALENDAR],
            icon: 'protoncalendar',
            title: 'ProtonCalendar',
            link: '/calendar'
        }
    ].filter(Boolean);

    const [apps, setApps] = useState(initialApps);

    useEffect(() => {
        if (!loadingUserScopes && hasScope(userScopes, USER_SCOPES.DRIVE)) {
            setApps([...apps, driveApp].filter(Boolean));
        }
    }, [userScopes, loadingUserScopes]);

    return (
        <aside className="aside noprint nomobile" id="aside-bar">
            <ul className="unstyled m0 aligncenter flex flex-column h100">
                {apps.map(({ appNames = [], icon, title, link }, index) => {
                    const isCurrent = appNames.includes(APP_NAME);
                    const key = `${index}`;
                    return (
                        <li key={key} className="mb0-5">
                            <Tooltip title={title} originalPlacement="right">
                                <Link
                                    to={link}
                                    className="center flex aside-link"
                                    external={!isCurrent}
                                    aria-current={isCurrent}
                                >
                                    <Icon name={icon} className="aside-linkIcon mauto" />
                                </Link>
                            </Tooltip>
                        </li>
                    );
                })}
                <li className="flex-item-fluid" />
                {items.map((item, index) => (
                    <li key={`${index}`} className="mb0-5">
                        {item}
                    </li>
                ))}
            </ul>
        </aside>
    );
};

export default AppsSidebar;
