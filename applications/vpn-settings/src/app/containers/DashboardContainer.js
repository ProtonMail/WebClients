import React, { useEffect, useRef } from 'react';
import {
    SubscriptionSection,
    BillingSection,
    useModals,
    VPNBlackFridayModal,
    usePlans,
    SubscriptionModal,
    useSubscription,
    useBlackFriday,
    useUser,
    useApi
} from 'react-components';
import { checkLastCancelledSubscription } from 'react-components/containers/payments/subscription/helpers';
import { PERMISSIONS } from 'proton-shared/lib/constants';
import { c } from 'ttag';

import Page from '../components/page/Page';
import PlansSection from '../components/sections/plans/PlansSection';

const { UPGRADER, PAID } = PERMISSIONS;

export const getDashboardPage = () => {
    return {
        text: c('Title').t`Dashboard`,
        route: '/dashboard',
        icon: 'dashboard',
        permissions: [UPGRADER],
        sections: [
            {
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
        ]
    };
};

const DashboardContainer = () => {
    const api = useApi();
    const { createModal } = useModals();
    const [plans, loadingPlans] = usePlans();
    const [subscription] = useSubscription();
    const isBlackFriday = useBlackFriday();
    const checked = useRef(false);
    const [user] = useUser();

    const handleSelect = ({ planIDs = [], cycle, currency, couponCode }) => {
        const plansMap = planIDs.reduce((acc, planID) => {
            const { Name } = plans.find(({ ID }) => ID === planID);
            acc[Name] = 1;
            return acc;
        }, Object.create(null));

        createModal(
            <SubscriptionModal
                plansMap={plansMap}
                customize={false}
                subscription={subscription}
                cycle={cycle}
                currency={currency}
                coupon={couponCode}
            />
        );
    };

    const check = async () => {
        if (await checkLastCancelledSubscription(api)) {
            createModal(<VPNBlackFridayModal plans={plans} onSelect={handleSelect} />);
        }
    };

    useEffect(() => {
        if (Array.isArray(plans) && !checked.current && user.isFree && isBlackFriday) {
            check();
            checked.current = true;
        }
    }, [loadingPlans]);

    return (
        <Page config={getDashboardPage()}>
            <PlansSection />
            <SubscriptionSection />
            <BillingSection />
        </Page>
    );
};

export default DashboardContainer;
