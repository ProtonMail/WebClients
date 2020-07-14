import React, { useEffect } from 'react';
import {
    PlansSection,
    SubscriptionSection,
    BillingSection,
    useUser,
    SettingsPropsShared,
    useModals,
    NewSubscriptionModal,
    usePlans,
    useSubscription,
    useOrganization
} from 'react-components';
import { PERMISSIONS, DEFAULT_CYCLE, PLAN_SERVICES } from 'proton-shared/lib/constants';
import { UserModel } from 'proton-shared/lib/interfaces';
import { c } from 'ttag';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { getPlanIDs, switchPlan } from 'proton-shared/lib/helpers/subscription';

import PrivateMainSettingsAreaWithPermissions from '../components/page/PrivateMainSettingsAreaWithPermissions';

const { UPGRADER, PAID } = PERMISSIONS;

export const getDashboardPage = (user: UserModel) => {
    return {
        text: c('Title').t`Dashboard`,
        to: '/dashboard',
        icon: 'dashboard',
        permissions: [UPGRADER],
        subsections: [
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
        ].filter(isTruthy)
    };
};

const DashboardContainer = ({ setActiveSection, location }: SettingsPropsShared) => {
    const [user] = useUser();
    const { createModal } = useModals();
    const searchParams = new URLSearchParams(location.search);
    const plan = searchParams.get('plan');
    const [plans, loadingPlans] = usePlans();
    const [subscription, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();

    useEffect(() => {
        if (plan && !loadingPlans && !loadingSubscription && !loadingOrganization) {
            const { Cycle = DEFAULT_CYCLE, Currency = plans[0].Currency } = subscription;
            const { ID } = plans.find(({ Name = '' }) => Name === plan);
            const planIDs = switchPlan({
                planIDs: getPlanIDs(subscription),
                plans,
                planID: ID,
                service: PLAN_SERVICES.VPN,
                organization
            });
            createModal(<NewSubscriptionModal planIDs={planIDs} currency={Currency} cycle={Cycle} />);
        }
    }, [loadingPlans, loadingSubscription, loadingOrganization]);

    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getDashboardPage(user)}
            setActiveSection={setActiveSection}
        >
            {!user.hasPaidVpn ? <PlansSection /> : null}
            <SubscriptionSection />
            <BillingSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default DashboardContainer;
