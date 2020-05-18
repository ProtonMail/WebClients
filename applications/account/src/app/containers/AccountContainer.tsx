import * as React from 'react';
import {
    UsernameSection,
    PasswordsSection,
    NewsSection,
    DeleteSection,
    EmailSection,
    TwoFactorSection
} from 'react-components';
import { c } from 'ttag';

import Page, { PageConfig } from '../components/Page';

export const getAccountPage = (): PageConfig => {
    return {
        text: c('Title').t`Account`,
        route: '/settings/account',
        icon: 'account',
        sections: [
            {
                text: c('Title').t`Username`,
                id: 'username'
            },
            {
                text: c('Title').t`Passwords`,
                id: 'passwords'
            },
            {
                text: c('Title').t`Two factor authentication`,
                id: 'two-fa'
            },
            {
                text: c('Title').t`Recovery & notification`,
                id: 'email'
            },
            {
                text: c('Title').t`Email subscriptions`,
                id: 'news'
            },
            {
                text: c('Title').t`Delete account`,
                id: 'delete'
            }
        ]
    };
};

interface Props {
    setActiveSection: (newActiveSection: string) => void;
}

const AccountContainer = ({ setActiveSection }: Props) => {
    return (
        <Page config={getAccountPage()} setActiveSection={setActiveSection}>
            <UsernameSection />
            <PasswordsSection />
            <TwoFactorSection />
            <EmailSection />
            <NewsSection />
            <DeleteSection />
        </Page>
    );
};

export default AccountContainer;
