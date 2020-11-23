import React from 'react';
import { c } from 'ttag';
import { DesktopNotificationSection, MessagesSection, ShortcutsSection, SettingsPropsShared } from 'react-components';

import PrivateMainSettingsAreaWithPermissions from '../../components/settings/PrivateMainSettingsAreaWithPermissions';

export const getGeneralPage = () => {
    return {
        text: c('Title').t`General`,
        to: '/settings/general',
        icon: 'general',
        subsections: [
            {
                text: c('Title').t`Desktop notifications`,
                id: 'desktop-notifications',
            },
            {
                text: c('Title').t`Messages`,
                id: 'messages',
            },
            {
                text: c('Title').t`Shortcuts`,
                id: 'shortcuts',
            },
        ],
    };
};

const GeneralContainer = ({ setActiveSection, location }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getGeneralPage()}
            setActiveSection={setActiveSection}
        >
            <DesktopNotificationSection />
            <MessagesSection />
            <ShortcutsSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default GeneralContainer;
