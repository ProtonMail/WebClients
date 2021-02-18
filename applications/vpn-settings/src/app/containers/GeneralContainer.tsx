import React from 'react';
import { c } from 'ttag';
import {
    LanguageSection,
    ThemesSection,
    SettingsPropsShared,
    EarlyAccessSection,
    useEarlyAccess,
} from 'react-components';
import locales from 'proton-shared/lib/i18n/locales';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';

import PrivateMainSettingsAreaWithPermissions from '../components/page/PrivateMainSettingsAreaWithPermissions';

export const getGeneralPage = ({ hasEarlyAccess }: { hasEarlyAccess: boolean }) => {
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
            hasEarlyAccess
                ? {
                      text: c('Title').t`Early Access`,
                      id: 'early-access',
                  }
                : undefined,
        ].filter(isTruthy),
    };
};

const GeneralContainer = ({ setActiveSection, location }: SettingsPropsShared) => {
    const { hasEarlyAccess } = useEarlyAccess();

    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getGeneralPage({ hasEarlyAccess })}
            setActiveSection={setActiveSection}
        >
            <LanguageSection locales={locales} />
            <ThemesSection />
            {hasEarlyAccess ? <EarlyAccessSection /> : null}
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default GeneralContainer;
