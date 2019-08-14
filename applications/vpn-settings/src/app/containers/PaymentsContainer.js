import React from 'react';
import { InvoicesSection, PaymentMethodsSection } from 'react-components';
import { PERMISSIONS } from 'proton-shared/lib/constants';
import { c } from 'ttag';

import Page from '../components/page/Page';

const { UPGRADER } = PERMISSIONS;

export const getPaymentsPage = () => {
    return {
        text: c('Title').t`Payments`,
        route: '/payments',
        icon: 'payments',
        permissions: [UPGRADER],
        sections: [
            {
                text: c('Title').t`Payment methods`,
                id: 'payment-methods'
            },
            {
                text: c('Title').t`Invoices`,
                id: 'invoices'
            }
        ]
    };
};

const PaymentsContainer = () => {
    return (
        <Page config={getPaymentsPage()}>
            <PaymentMethodsSection />
            <InvoicesSection />
        </Page>
    );
};

export default PaymentsContainer;
