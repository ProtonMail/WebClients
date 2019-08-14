import React from 'react';
import {
    UsernameSection,
    PasswordsSection,
    TwoFactorSection,
    NewsSection,
    DeleteSection,
    OpenVPNAccountSection
} from 'react-components';
import { c } from 'ttag';

import Page from '../components/page/Page';

export const getAccountPage = () => {
    return {
        text: c('Title').t`Account`,
        route: '/account',
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
                text: c('Title').t`Two-factor authentication`,
                id: '2fa'
            },
            {
                text: c('Title').t`OpenVPN / IKEv2 username`,
                id: 'openvpn'
            },
            {
                text: c('Title').t`Email subscriptions`,
                id: 'news'
            },
            {
                text: c('Title').t`Delete`,
                id: 'delete'
            }
        ]
    };
};

const AccountContainer = () => {
    return (
        <Page config={getAccountPage()}>
            <UsernameSection />
            <PasswordsSection />
            <TwoFactorSection />
            <OpenVPNAccountSection />
            <NewsSection />
            <DeleteSection />
        </Page>
    );
};

export default AccountContainer;
