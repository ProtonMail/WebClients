import React from 'react';
import {
    PaymentMethodsSection,
    InvoicesSection,
    BillingSection,
    SettingsPropsShared,
    GiftCodeSection,
    CreditsSection,
} from 'react-components';
import { c } from 'ttag';
import { PERMISSIONS } from 'proton-shared/lib/constants';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';

import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

const { UPGRADER, NOT_SUB_USER, PAID } = PERMISSIONS;

export const getPaymentPage = () => {
    return {
        text: c('Title').t`Payment`,
        to: '/payment',
        icon: 'payments-type-card',
        permissions: [UPGRADER, NOT_SUB_USER],
        subsections: [
            {
                text: c('Title').t`Billing details`,
                id: 'billing',
                permissions: [PAID],
            },
            {
                text: c('Title').t`Payment methods`,
                id: 'payment-methods',
            },
            {
                text: c('Title').t`Credits`,
                id: 'credits',
                permissions: [PAID],
            },
            {
                text: c('Title').t`Gift code`,
                id: 'gift-code',
                permissions: [PAID],
            },
            {
                text: c('Title').t`Invoices`,
                id: 'invoices',
            },
        ].filter(isTruthy),
    };
};

const AccountPaymentSettings = ({ location, setActiveSection }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getPaymentPage()}
            setActiveSection={setActiveSection}
        >
            <BillingSection />
            <PaymentMethodsSection />
            <CreditsSection />
            <GiftCodeSection />
            <InvoicesSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default AccountPaymentSettings;
