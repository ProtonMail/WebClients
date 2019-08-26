import React from 'react';
import PropTypes from 'prop-types';
import { Icon, useUser, useConfig } from 'react-components';
import { APPS } from 'proton-shared/lib/constants';

const { PROTONMAIL, PROTONCONTACTS, PROTONCALENDAR, PROTONMAIL_SETTINGS } = APPS;

const AppsSidebar = ({ items = [] }) => {
    const { APP_NAME } = useConfig();
    const [{ isPaid }] = useUser();
    const apps = [
        { appNames: [PROTONMAIL, PROTONMAIL_SETTINGS], icon: 'protonmail', title: 'ProtonMail', link: '/inbox' },
        isPaid && { appNames: [PROTONCALENDAR], icon: 'calendar', title: 'ProtonCalendar', link: '/calendar' },
        { appNames: [PROTONCONTACTS], icon: 'contacts', title: 'ProtonContacts', link: '/contacts' }
    ].filter(Boolean);

    return (
        <aside className="aside noprint" id="aside-bar">
            <ul className="unstyled m0 aligncenter flex flex-column h100">
                {apps.map(({ appNames = [], icon, title, link, target }, index) => {
                    const isCurrent = appNames.includes(APP_NAME);
                    const key = `${index}`;
                    return (
                        <li key={key} className="mb0-5">
                            <a
                                href={link}
                                target={target ? target : '_self'}
                                className="center flex aside-link"
                                title={title}
                                disabled={isCurrent}
                                aria-current={isCurrent}
                            >
                                <Icon name={icon} className="aside-linkIcon mauto fill-global-light" />
                            </a>
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

AppsSidebar.propTypes = {
    items: PropTypes.arrayOf(PropTypes.node)
};

export default AppsSidebar;
