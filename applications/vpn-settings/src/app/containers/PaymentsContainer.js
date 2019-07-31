import React from 'react';
import { InvoicesSection, PaymentMethodsSection } from 'react-components';
import { c } from 'ttag';

import Page from '../components/page/Page';

const PaymentsContainer = () => {
    return (
        <Page title={c('Title').t`Payments`}>
            <PaymentMethodsSection />
            <InvoicesSection />
        </Page>
    );
};

export default PaymentsContainer;
