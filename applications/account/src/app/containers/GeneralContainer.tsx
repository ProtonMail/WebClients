import React from 'react';
import { c } from 'ttag';
import { LanguageSection, MessagesSection, ShortcutsSection, SearchSection } from 'react-components';

import locales from '../locales';
import Page from '../components/Page';

export const getGeneralPage = () => {
    return {
        text: c('Title').t`General`,
        route: '/settings/general',
        icon: 'general',
        sections: [
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

interface Props {
    setActiveSection: (newActiveSection: string) => void;
}

const GeneralContainer = ({ setActiveSection }: Props) => {
    return (
        <Page config={getGeneralPage()} setActiveSection={setActiveSection}>
            <LanguageSection locales={locales} />
            <MessagesSection />
            <SearchSection />
            <ShortcutsSection />
        </Page>
    );
};

export default GeneralContainer;
