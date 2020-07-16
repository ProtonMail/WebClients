import React from 'react';
import { c } from 'ttag';
import {
    LanguageSection,
    MessagesSection,
    ShortcutsSection,
    SearchSection,
    SettingsPropsShared
} from 'react-components';

import locales from '../locales';
import PrivateMainSettingsAreaWithPermissions from '../components/PrivateMainSettingsAreaWithPermissions';

export const getGeneralPage = () => {
    return {
        text: c('Title').t`General`,
        to: '/settings/general',
        icon: 'general',
        subsections: [
            {
                text: c('Title').t`Language`,
                id: 'language'
            },
            {
                text: c('Title').t`Messages`,
                id: 'messages'
            },
            {
                text: c('Title').t`Search`,
                id: 'search'
            },
            {
                text: c('Title').t`Shortcuts`,
                id: 'shortcuts'
            }
        ]
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
            <MessagesSection />
            <SearchSection />
            <ShortcutsSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default GeneralContainer;
