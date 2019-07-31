import React from 'react';
import { SubscriptionSection, BillingSection } from 'react-components';
import { c } from 'ttag';

import Page from '../components/page/Page';

const DashboardContainer = () => {
    return (
        <Page title={c('Title').t`Dashboard`}>
            <SubscriptionSection />
            <BillingSection />
        </Page>
    );
};

export default DashboardContainer;
