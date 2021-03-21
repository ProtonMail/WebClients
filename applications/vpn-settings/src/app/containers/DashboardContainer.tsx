import React, { useEffect } from 'react';
import {
    PlansSection,
    SubscriptionSection,
    BillingSection,
    useUser,
    SettingsPropsShared,
    useModals,
    SubscriptionModal,
    usePlans,
    useSubscription,
    useOrganization,
} from 'react-components';
import { PERMISSIONS, DEFAULT_CYCLE, PLAN_SERVICES, CYCLE, CURRENCIES } from 'proton-shared/lib/constants';
import { Plan, PlanIDs, UserModel } from 'proton-shared/lib/interfaces';
import { c } from 'ttag';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { getPlanIDs } from 'proton-shared/lib/helpers/subscription';
import { switchPlan } from 'proton-shared/lib/helpers/planIDs';
import { toMap } from 'proton-shared/lib/helpers/object';
import { SUBSCRIPTION_STEPS } from 'react-components/containers/payments/subscription/constants';

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
                id: 'plans',
            },
            {
                text: c('Title').t`Subscription`,
                id: 'subscription',
                permissions: [PAID],
            },
            {
                text: c('Title').t`Billing`,
                id: 'billing',
                permissions: [PAID],
            },
        ].filter(isTruthy),
    };
};

interface PlansMap {
    [planName: string]: Plan;
}

const DashboardContainer = ({ setActiveSection, location }: SettingsPropsShared) => {
    const [user] = useUser();
    const { createModal } = useModals();
    const searchParams = new URLSearchParams(location.search);
    const [plans, loadingPlans] = usePlans();
    const [subscription, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();

    const openSubscriptionModal = () => {
        const planName = searchParams.get('plan');
        if (!plans || !planName || loadingPlans || loadingSubscription || loadingOrganization) {
            return;
        }
        const coupon = searchParams.get('coupon');
        const cycleParam = parseInt(searchParams.get('cycle') as any, 10);
        const currencyParam = searchParams.get('currency') as any;
        const defaultCycle =
            cycleParam && [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS].includes(cycleParam)
                ? cycleParam
                : DEFAULT_CYCLE;
        const defaultCurrency = currencyParam && CURRENCIES.includes(currencyParam) ? currencyParam : plans[0].Currency;
        const { Cycle = defaultCycle, Currency = defaultCurrency } = subscription;
        const plansMap = toMap(plans, 'Name') as PlansMap;
        if (user.isFree) {
            const planIDs = planName.split('_').reduce<PlanIDs>((acc, name) => {
                acc[plansMap[name].ID] = 1;
                return acc;
            }, {});
            if (!Object.keys(planIDs).length) {
                return;
            }
            createModal(
                <SubscriptionModal
                    planIDs={planIDs}
                    currency={defaultCurrency}
                    cycle={defaultCycle}
                    coupon={coupon}
                    step={SUBSCRIPTION_STEPS.CHECKOUT}
                />
            );
            return;
        }
        const plan = plansMap[planName];
        if (!plan) {
            return;
        }
        const planIDs = switchPlan({
            planIDs: getPlanIDs(subscription),
            plans,
            planID: plan.ID,
            service: PLAN_SERVICES.VPN,
            organization,
        });
        createModal(
            <SubscriptionModal
                planIDs={planIDs}
                currency={Currency}
                cycle={Cycle}
                step={SUBSCRIPTION_STEPS.CUSTOMIZATION}
            />
        );
    };

    useEffect(() => {
        openSubscriptionModal();
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
