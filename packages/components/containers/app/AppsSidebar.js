import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'react-components';
import { APPS } from 'proton-shared/lib/constants';
import { c } from 'ttag';

const { PROTONMAIL, PROTONCONTACTS, PROTONCALENDAR, PROTONVPN_SETTINGS } = APPS;

const AppsSidebar = ({ currentApp = '' }) => {
    const apps = [
        { id: PROTONMAIL, icon: 'protonmail', title: 'ProtonMail', link: '/inbox' },
        { id: PROTONCALENDAR, icon: 'calendar', title: 'ProtonCalendar', link: '/calendar' },
        { id: PROTONCONTACTS, icon: 'contacts', title: 'ProtonContacts', link: '/contacts' },
        {
            id: PROTONVPN_SETTINGS,
            icon: 'protonvpn',
            title: c('Title').t`ProtonVPN settings`,
            target: '_blank',
            link: 'https://account.protonvpn.com/login'
        }
    ];

    return (
        <aside className="aside noprint" id="aside-bar">
            <ul className="unstyled m0 aligncenter">
                {apps.map(({ id, icon, title, link, target }) => {
                    const isCurrent = currentApp === id;
                    return (
                        <li key={id} className="mb0-5">
                            <a
                                href={link}
                                target={target ? target : '_self'}
                                className="center flex js-notyet aside-link"
                                title={title}
                                disabled={isCurrent}
                                aria-current={isCurrent}
                            >
                                <Icon name={icon} />
                            </a>
                        </li>
                    );
                })}
            </ul>
        </aside>
    );
};

AppsSidebar.propTypes = {
    currentApp: PropTypes.string
};

export default AppsSidebar;
