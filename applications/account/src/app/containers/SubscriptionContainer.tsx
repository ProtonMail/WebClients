import React from 'react';
import {
    PaymentMethodsSection,
    InvoicesSection,
    PlansSection,
    BillingSection,
    SubscriptionSection,
    useUser
} from 'react-components';
import { c } from 'ttag';
import { PERMISSIONS } from 'proton-shared/lib/constants';

import Page from '../components/Page';

const { UPGRADER, PAID } = PERMISSIONS;

export const getSubscriptionPage = (user = {}) => {
    return {
        text: c('Title').t`Subscription`,
        route: '/settings/subscription',
        icon: 'dashboard',
        permissions: [UPGRADER],
        sections: [
            !user.hasPaidMail && {
                text: c('Title').t`Plans`,
                id: 'plans'
            },
            {
                text: c('Title').t`Subscription`,
                id: 'subscription',
                permissions: [PAID]
            },
            {
                text: c('Title').t`Billing details`,
                id: 'billing',
                permissions: [PAID]
            },
            {
                text: c('Title').t`Payment methods`,
                id: 'payment-methods'
            },
            {
                text: c('Title').t`Invoices`,
                id: 'invoices'
            }
        ].filter(Boolean)
    };
};

interface Props {
    setActiveSection: (newActiveSection: string) => void;
}

const SubscriptionContainer = ({ setActiveSection }: Props) => {
    const [user, loadingUser] = useUser();
    if (loadingUser) {
        return null;
    }
    if (user.hasPaidMail) {
        return (
            <Page config={getSubscriptionPage(user)} setActiveSection={setActiveSection}>
                <SubscriptionSection />
                <BillingSection />
                <PaymentMethodsSection />
                <InvoicesSection />
            </Page>
        );
    }
    return (
        <Page config={getSubscriptionPage(user)} setActiveSection={setActiveSection}>
            <PlansSection />
            <SubscriptionSection />
            <BillingSection />
            <PaymentMethodsSection />
            <InvoicesSection />
        </Page>
    );
};

export default SubscriptionContainer;
