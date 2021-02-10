import React from 'react';
import { c } from 'ttag';
import { LanguageSection, ThemesSection, SettingsPropsShared, EarlyAccessSection } from 'react-components';
import locales from 'proton-shared/lib/i18n/locales';

import PrivateMainSettingsAreaWithPermissions from '../components/page/PrivateMainSettingsAreaWithPermissions';

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
                text: c('Title').t`Themes`,
                id: 'themes',
            },
            {
                text: c('Title').t`Early Access`,
                id: 'early-access',
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
            <LanguageSection locales={locales} />
            <ThemesSection />
            <EarlyAccessSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default GeneralContainer;
