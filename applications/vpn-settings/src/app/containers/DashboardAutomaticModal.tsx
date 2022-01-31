import { MutableRefObject, useEffect } from 'react';
import { SubscriptionModal, useModals, useOrganization, usePlans, useSubscription, useUser } from '@proton/components';
import { useHistory } from 'react-router-dom';
import { BLACK_FRIDAY, CURRENCIES, CYCLE, DEFAULT_CYCLE, PLAN_SERVICES } from '@proton/shared/lib/constants';
import { Plan, PlanIDs } from '@proton/shared/lib/interfaces';
import { getPlanIDs } from '@proton/shared/lib/helpers/subscription';
import { switchPlan } from '@proton/shared/lib/helpers/planIDs';
import { toMap } from '@proton/shared/lib/helpers/object';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';

interface PlansMap {
    [planName: string]: Plan;
}

const DashboardAutomaticModal = ({ onceRef }: { onceRef: MutableRefObject<boolean> }) => {
    const [user] = useUser();
    const { createModal } = useModals();
    const [plans, loadingPlans] = usePlans();
    const [subscription, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();
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

    return null;
};

export default DashboardAutomaticModal;
