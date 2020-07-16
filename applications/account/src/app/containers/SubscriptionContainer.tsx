import React from 'react';
import {
    PaymentMethodsSection,
    InvoicesSection,
    PlansSection,
    BillingSection,
    SubscriptionSection,
    useUser,
    SettingsPropsShared,
} from 'react-components';
import { c } from 'ttag';
import { PERMISSIONS } from 'proton-shared/lib/constants';
import { UserModel } from 'proton-shared/lib/interfaces';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';

import PrivateMainSettingsAreaWithPermissions from '../components/PrivateMainSettingsAreaWithPermissions';

const { UPGRADER, PAID } = PERMISSIONS;

export const getSubscriptionPage = (user: UserModel) => {
    return {
        text: c('Title').t`Subscription`,
        to: '/subscription',
        icon: 'dashboard',
        permissions: [UPGRADER],
        subsections: [
            !user.hasPaidMail && {
                text: c('Title').t`Plans`,
                id: 'plans',
            },
            {
                text: c('Title').t`Subscription`,
                id: 'subscription',
                permissions: [PAID],
            },
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
                text: c('Title').t`Invoices`,
                id: 'invoices',
            },
        ].filter(isTruthy),
    };
};

const SubscriptionContainer = ({ location, setActiveSection }: SettingsPropsShared) => {
    const [user] = useUser();
    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getSubscriptionPage(user)}
            setActiveSection={setActiveSection}
        >
            {!user.hasPaidMail ? <PlansSection /> : null}
            <SubscriptionSection />
            <BillingSection />
            <PaymentMethodsSection />
            <InvoicesSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default SubscriptionContainer;
