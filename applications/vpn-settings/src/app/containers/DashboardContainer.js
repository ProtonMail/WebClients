import React from 'react';
import PropTypes from 'prop-types';
import { PlansSection, SubscriptionSection, BillingSection, useUser } from 'react-components';
import { PERMISSIONS } from 'proton-shared/lib/constants';
import { c } from 'ttag';

import Page from '../components/page/Page';

const { UPGRADER, PAID } = PERMISSIONS;

export const getDashboardPage = (user = {}) => {
    return {
        text: c('Title').t`Dashboard`,
        route: '/dashboard',
        icon: 'dashboard',
        permissions: [UPGRADER],
        sections: [
            !user.hasPaidVpn && {
                text: c('Title').t`Plans`,
                id: 'plans'
            },
            {
                text: c('Title').t`Subscription`,
                id: 'subscription',
                permissions: [PAID]
            },
            {
                text: c('Title').t`Billing`,
                id: 'billing',
                permissions: [PAID]
            }
        ].filter(Boolean)
    };
};

const DashboardContainer = ({ setActiveSection }) => {
    const [user, loadingUser] = useUser();

    if (loadingUser) {
        return null;
    }

    if (user.hasPaidVpn) {
        return (
            <Page config={getDashboardPage(user)} setActiveSection={setActiveSection}>
                <SubscriptionSection />
                <BillingSection />
            </Page>
        );
    }

    return (
        <Page config={getDashboardPage(user)} setActiveSection={setActiveSection}>
            <PlansSection />
            <SubscriptionSection />
            <BillingSection />
        </Page>
    );
};

DashboardContainer.propTypes = {
    setActiveSection: PropTypes.func
};

export default DashboardContainer;
