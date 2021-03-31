import React from 'react';
import { c } from 'ttag';
import { APPS_CONFIGURATION } from 'proton-shared/lib/constants';

import { AppLink, Icon, SimpleDropdown, Href } from '../../components';
import { useApps } from '../../hooks';

const AppsDropdown = () => {
    const applications = useApps();
    const apps = applications.map((app) => ({
        toApp: app,
        icon: APPS_CONFIGURATION[app].icon,
        title: APPS_CONFIGURATION[app].name,
    }));

    return (
        <SimpleDropdown
            as="button"
            type="button"
            hasCaret={false}
            content={<Icon name="more" className="apps-dropdown-button-icon flex-item-noshrink" />}
            className="apps-dropdown-button"
            dropdownClassName="apps-dropdown ui-prominent"
            originalPlacement="bottom-right"
            title={c('Apps dropdown').t`Proton applications`}
        >
            <ul className="apps-dropdown-list unstyled m0 scroll-if-needed">
                {apps.map(({ toApp, icon, title }, index) => {
                    const key = `${index}`;
                    return (
                        <li key={key}>
                            <AppLink
                                to="/"
                                toApp={toApp}
                                className="apps-dropdown-link text-lg m0 p1 pt0-75 pb0-75 flex flex-nowrap flex-align-items-center"
                                title={c('Apps dropdown').t`Go to ${title}`}
                            >
                                <Icon name={icon} size={20} className="mr0-5" />
                                <span>{title}</span>
                            </AppLink>
                        </li>
                    );
                })}
                <li>
                    <Href
                        url="https://account.protonvpn.com/login"
                        className="apps-dropdown-link text-lg m0 p1 pt0-75 pb0-75 flex flex-nowrap flex-align-items-center"
                        title={c('Apps dropdown').t`Go to ProtonVPN`}
                    >
                        <Icon name="protonvpn" size={20} className="mr0-5" />
                        <span>ProtonVPN</span>
                    </Href>
                </li>
            </ul>
        </SimpleDropdown>
    );
};

export default AppsDropdown;
