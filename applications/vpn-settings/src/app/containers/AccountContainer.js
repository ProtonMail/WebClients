import React from 'react';
import { NewsSection } from 'react-components';
import { c } from 'ttag';

import Page from '../components/page/Page';

const AccountContainer = () => {
    return (
        <Page title={c('Title').t`Account`}>
            <NewsSection />
        </Page>
    );
};

export default AccountContainer;
