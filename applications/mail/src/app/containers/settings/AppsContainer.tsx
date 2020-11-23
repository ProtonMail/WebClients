import React from 'react';
import { c } from 'ttag';

import { ProtonMailBetaSection, ProtonMailAppsSection, SettingsPropsShared } from 'react-components';

import PrivateMainSettingsAreaWithPermissions from '../../components/settings/PrivateMainSettingsAreaWithPermissions';

export const getAppsPage = () => {
    return {
        text: c('Title').t`Apps`,
        to: '/settings/apps',
        icon: 'vpn-connx',
        subsections: [
            {
                text: c('Title').t`Mobile apps`,
                id: 'protonmail-apps',
            },
            {
                text: c('Title').t`Beta program`,
                id: 'protonmail-beta',
            },
        ],
    };
};

const AppsContainer = ({ setActiveSection, location }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getAppsPage()}
            setActiveSection={setActiveSection}
        >
            <ProtonMailAppsSection />
            <ProtonMailBetaSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default AppsContainer;
