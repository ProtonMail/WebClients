import { useEffect, useRef } from 'react';
import {
    BillingSection,
    CancelSubscriptionSection,
    CreditsSection,
    GiftCodeSection,
    PlansSection,
    SettingsPropsShared,
    SubscriptionModal,
    useModals,
    useOrganization,
    usePlans,
    useSubscription,
    useUser,
    YourPlanSection,
} from '@proton/components';
import { useHistory } from 'react-router-dom';
import {
    BLACK_FRIDAY,
    CURRENCIES,
    CYCLE,
    DEFAULT_CYCLE,
    PERMISSIONS,
    PLAN_SERVICES,
} from '@proton/shared/lib/constants';
import { Plan, PlanIDs, UserModel } from '@proton/shared/lib/interfaces';
import { c } from 'ttag';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { getPlanIDs } from '@proton/shared/lib/helpers/subscription';
import { switchPlan } from '@proton/shared/lib/helpers/planIDs';
import { toMap } from '@proton/shared/lib/helpers/object';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';

import PrivateMainSettingsAreaWithPermissions from '../components/page/PrivateMainSettingsAreaWithPermissions';

const { UPGRADER, PAID } = PERMISSIONS;

export const getDashboardPage = (user: UserModel) => {
    return {
        text: c('Title').t`Dashboard`,
        to: '/dashboard',
        icon: 'grid',
        permissions: [UPGRADER],
        subsections: [
            !user.hasPaidVpn && {
                text: c('Title').t`Plans`,
                id: 'plans',
            },
            {
                text: !user.hasPaidVpn ? c('Title').t`Your current plan` : c('Title').t`Your plan`,
                id: 'subscription',
            },
            {
                text: c('Title').t`Billing`,
                id: 'billing',
                permissions: [PAID],
            },
            {
                text: c('Title').t`Credits`,
                id: 'credits',
            },
            {
                text: c('Title').t`Gift Code`,
                id: 'gift-code',
            },
            user.hasPaidVpn && {
                text: c('Title').t`Downgrade account`,
                id: 'cancel-subscription',
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
    const [plans, loadingPlans] = usePlans();
    const [subscription, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();
    const onceRef = useRef(false);
    const history = useHistory();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const planName = searchParams.get('plan');
        if (!plans || !planName || loadingPlans || loadingSubscription || loadingOrganization || onceRef.current) {
            return;
        }

        searchParams.delete('plan');
        history.replace({
            search: undefined,
        });
        onceRef.current = true;

        const coupon = searchParams.get('coupon');

        const cycleParam = parseInt(searchParams.get('cycle') as any, 10);
        const maybeCycle =
            cycleParam && [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS].includes(cycleParam) ? cycleParam : undefined;

        const currencyParam = searchParams.get('currency') as any;
        const maybeCurrency = currencyParam && CURRENCIES.includes(currencyParam) ? currencyParam : undefined;

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
                    currency={maybeCurrency || plans[0].Currency}
                    cycle={maybeCycle || DEFAULT_CYCLE}
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
        const isBlackFridayCoupon = coupon === BLACK_FRIDAY.COUPON_CODE;
        createModal(
            <SubscriptionModal
                planIDs={planIDs}
                currency={maybeCurrency || subscription.Currency}
                cycle={maybeCycle || subscription.Cycle}
                coupon={coupon}
                step={isBlackFridayCoupon ? SUBSCRIPTION_STEPS.CHECKOUT : SUBSCRIPTION_STEPS.CUSTOMIZATION}
                disableBackButton={isBlackFridayCoupon}
            />
        );
    }, [loadingPlans, loadingSubscription, loadingOrganization]);

    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getDashboardPage(user)}
            setActiveSection={setActiveSection}
        >
            {!user.hasPaidVpn ? <PlansSection /> : null}
            <YourPlanSection />
            <BillingSection />
            <CreditsSection />
            <GiftCodeSection />
            {user.hasPaidVpn && <CancelSubscriptionSection />}
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default DashboardContainer;
