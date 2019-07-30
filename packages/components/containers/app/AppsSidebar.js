import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'react-components';

const AppsSidebar = ({ currentApp = '' }) => {
    const apps = [
        { id: 'protonmail', icon: 'protonmail', title: 'ProtonMail', link: '/inbox' },
        { id: 'protoncontacts', icon: 'contacts', title: 'ProtonContacts', link: '/contacts' },
        { id: 'protoncalendar', icon: 'calendar', title: 'ProtonCalendar', link: '/calendar' },
        { id: 'protonvpn', icon: 'protonvpn', title: 'ProtonVPN', link: 'https://account.protonvpn.com/login' },
        { id: 'protonsettings', icon: 'settings', title: 'Settings', link: '/settings' }
    ];

    return (
        <aside className="aside noprint" id="aside-bar">
            <ul className="unstyled m0 aligncenter">
                {apps.map(({ id, icon, title, link }) => {
                    return (
                        <li key={id} className="mb0-5">
                            <a
                                href={link}
                                target="_self"
                                className="center flex js-notyet aside-link"
                                title={title}
                                aria-current={currentApp === id}
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
