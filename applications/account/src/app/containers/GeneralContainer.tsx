import React from 'react';
import { c } from 'ttag';
import { LanguageSection, SettingsPropsShared, ThemesSection } from 'react-components';
import locales from 'proton-shared/lib/i18n/locales';

import PrivateMainSettingsAreaWithPermissions from '../components/PrivateMainSettingsAreaWithPermissions';

export const getGeneralPage = () => {
    return {
        text: c('Title').t`General`,
        to: '/general',
        icon: 'general',
        subsections: [
            {
                text: c('Title').t`Language`,
                id: 'language',
            },
            {
                text: c('Title').t`Theme`,
                id: 'theme',
            },
        ],
    };
};

const GeneralContainer = ({ location, setActiveSection }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getGeneralPage()}
            setActiveSection={setActiveSection}
        >
            <LanguageSection locales={locales} />
            <ThemesSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default GeneralContainer;
