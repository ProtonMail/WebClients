import React from 'react';
import { c } from 'ttag';
import { LanguageSection, ThemesSection, SettingsPropsShared } from 'react-components';
import locales from 'proton-shared/lib/i18n/locales';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';

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
        ].filter(isTruthy),
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
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default GeneralContainer;
