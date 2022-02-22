import { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useLoad, useOrganization, usePlans, useSubscription, useUser, useSubscriptionModal } from '@proton/components';
import { Currency, Plan, PlanIDs, Subscription } from '@proton/shared/lib/interfaces';
import { CURRENCIES, CYCLE, DEFAULT_CYCLE, PLAN_SERVICES } from '@proton/shared/lib/constants';
import { toMap } from '@proton/shared/lib/helpers/object';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import { getPlanIDs } from '@proton/shared/lib/helpers/subscription';
import { switchPlan } from '@proton/shared/lib/helpers/planIDs';

interface PlansMap {
    [planName: string]: Plan;
}

const getParameters = (search: string, plans: Plan[], subscription: Subscription) => {
    const params = new URLSearchParams(location.search);

    const planName = params.get('plan') || '';
    const coupon = params.get('coupon') || undefined;
    const cycleParam = parseInt(params.get('cycle') as any, 10);
    const currencyParam = params.get('currency')?.toUpperCase();
    const target = params.get('target');
    const edit = params.get('edit');

    const parsedTarget = (() => {
        if (target === 'compare') {
            return SUBSCRIPTION_STEPS.PLAN_SELECTION;
        }
        if (target === 'checkout') {
            return SUBSCRIPTION_STEPS.CHECKOUT;
        }
    })();

    const parsedCycle =
        cycleParam && [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS].includes(cycleParam) ? cycleParam : undefined;

    const parsedCurrency =
        currencyParam && CURRENCIES.includes(currencyParam as any) ? (currencyParam as Currency) : undefined;

    const plansMap = toMap(plans, 'Name') as PlansMap;

    const planIDs = planName.split('_').reduce<PlanIDs>((acc, name) => {
        if (!plansMap[name]) {
            return acc;
        }
        acc[plansMap[name].ID] = 1;
        return acc;
    }, {});

    return {
        planIDs,
        coupon,
        cycle: parsedCycle || subscription.Cycle || DEFAULT_CYCLE,
        currency: parsedCurrency || subscription.Currency || plans[0].Currency,
        step: parsedTarget || SUBSCRIPTION_STEPS.CHECKOUT,
        disableBackButton: edit === 'disable',
    };
};

const AutomaticSubscriptionModal = () => {
    const history = useHistory();
    const location = useLocation();

    const [user] = useUser();
    const [open] = useSubscriptionModal();
    const [plans, loadingPlans] = usePlans();
    const [subscription, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();

    useLoad();

    useEffect(() => {
        if (!plans || !subscription || loadingPlans || loadingSubscription || loadingOrganization) {
            return;
        }

        const { planIDs, currency, cycle, coupon, step, disableBackButton } = getParameters(
            location.search,
            plans,
            subscription
        );
        if (!Object.keys(planIDs).length) {
            return;
        }

        history.replace({ search: undefined });

        if (user.isFree) {
            open({
                planIDs,
                currency,
                cycle,
                coupon,
                step,
                disableBackButton,
            });
            return;
        }

        let newPlanIDs = planIDs;
        // If only one plan ID is specified, we assume that the intention is to switch to that plan.
        // Otherwise, we assume that the plans passed are valid to be used.
        if (Object.keys(planIDs).length === 1) {
            newPlanIDs = Object.keys(planIDs).reduce((acc, planID) => {
                return switchPlan({
                    planIDs: getPlanIDs(subscription),
                    plans,
                    planID,
                    service: PLAN_SERVICES.MAIL,
                    organization,
                });
            }, getPlanIDs(subscription));
        }

        open({
            planIDs: newPlanIDs,
            currency,
            cycle,
            coupon,
            step,
            disableBackButton,
        });
    }, [loadingPlans, loadingSubscription, loadingOrganization, location.search]);

    return null;
};

export default AutomaticSubscriptionModal;
