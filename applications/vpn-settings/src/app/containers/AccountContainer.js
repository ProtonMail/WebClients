import React from 'react';
import { UsernameSection, PasswordsSection, TwoFactorSection, NewsSection, DeleteSection } from 'react-components';
import { c } from 'ttag';

import Page from '../components/page/Page';

const AccountContainer = () => {
    return (
        <Page title={c('Title').t`Account`}>
            <UsernameSection />
            <PasswordsSection />
            <TwoFactorSection />
            <NewsSection />
            <DeleteSection />
        </Page>
    );
};

export default AccountContainer;
