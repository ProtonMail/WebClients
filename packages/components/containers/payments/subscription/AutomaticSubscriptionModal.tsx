import { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useLoad, usePlans, useSubscription, useSubscriptionModal } from '@proton/components';
import { Currency, Plan, Subscription } from '@proton/shared/lib/interfaces';
import { CURRENCIES, CYCLE, DEFAULT_CYCLE, PLANS } from '@proton/shared/lib/constants';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';

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

    const plan = plans.find(({ Name }) => Name === planName);

    return {
        plan,
        coupon,
        cycle: parsedCycle || subscription.Cycle || DEFAULT_CYCLE,
        currency: parsedCurrency || subscription.Currency || plans[0].Currency,
        step: parsedTarget || SUBSCRIPTION_STEPS.CHECKOUT,
        disablePlanSelection: edit === 'disable',
    };
};

const AutomaticSubscriptionModal = () => {
    const history = useHistory();
    const location = useLocation();

    const [open, loadingModal] = useSubscriptionModal();
    const [plans, loadingPlans] = usePlans();
    const [subscription, loadingSubscription] = useSubscription();

    useLoad();

    useEffect(() => {
        if (!plans || !subscription || loadingPlans || loadingSubscription || loadingModal) {
            return;
        }

        const { plan, currency, cycle, coupon, step, disablePlanSelection } = getParameters(
            location.search,
            plans,
            subscription
        );
        if (!plan) {
            return;
        }

        history.replace({ search: undefined });

        open({
            plan: plan.Name as PLANS,
            currency,
            cycle,
            coupon,
            step,
            disablePlanSelection,
        });
    }, [loadingPlans, loadingSubscription, loadingModal, location.search]);

    return null;
};

export default AutomaticSubscriptionModal;
