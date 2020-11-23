import React from 'react';
import { LayoutsSection, ThemesSection, ToolbarsSection, SettingsPropsShared } from 'react-components';
import { c } from 'ttag';

import PrivateMainSettingsAreaWithPermissions from '../../components/settings/PrivateMainSettingsAreaWithPermissions';

export const getAppearancePage = () => {
    return {
        text: c('Title').t`Appearance`,
        to: '/settings/appearance',
        icon: 'apparence',
        subsections: [
            {
                text: c('Title').t`Layouts`,
                id: 'layouts',
            },
            {
                text: c('Title').t`Toolbars`,
                id: 'toolbars',
            },
            {
                text: c('Title').t`Themes`,
                id: 'themes',
            },
        ],
    };
};

const AppearanceContainer = ({ setActiveSection, location }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getAppearancePage()}
            setActiveSection={setActiveSection}
        >
            <LayoutsSection />
            <ToolbarsSection />
            <ThemesSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default AppearanceContainer;
