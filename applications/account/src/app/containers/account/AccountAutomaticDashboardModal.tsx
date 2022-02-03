import { useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import {
    useUser,
    SubscriptionModal,
    useModals,
    usePlans,
    useSubscription,
    useOrganization,
    useLoad,
} from '@proton/components';
import { Plan, PlanIDs } from '@proton/shared/lib/interfaces';
import { DEFAULT_CYCLE, PLAN_SERVICES, CYCLE, CURRENCIES } from '@proton/shared/lib/constants';
import { toMap } from '@proton/shared/lib/helpers/object';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import { getPlanIDs } from '@proton/shared/lib/helpers/subscription';
import { switchPlan } from '@proton/shared/lib/helpers/planIDs';
import * as H from 'history';

interface PlansMap {
    [planName: string]: Plan;
}

const AccountAutomaticDashboardModal = ({ location }: { location: H.Location }) => {
    const onceRef = useRef(false);
    const [user] = useUser();

    const { createModal } = useModals();
    const [plans, loadingPlans] = usePlans();
    const [subscription, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();
    const history = useHistory();
    useLoad();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const planName = searchParams.get('plan');
        if (!plans || !planName || loadingPlans || loadingSubscription || loadingOrganization || onceRef.current) {
            return;
        }

        searchParams.delete('plan');
        history.replace({
            search: searchParams.toString(),
        });
        onceRef.current = true;

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
    }, [loadingPlans, loadingSubscription, loadingOrganization]);

    return null;
};

export default AccountAutomaticDashboardModal;
