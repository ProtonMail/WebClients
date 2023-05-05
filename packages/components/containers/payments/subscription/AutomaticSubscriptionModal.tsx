import { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { useLoad, usePlans, useSubscription, useSubscriptionModal, useUser } from '@proton/components';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import { CURRENCIES, DEFAULT_CYCLE, PLANS, PLAN_TYPES } from '@proton/shared/lib/constants';
import { getValidCycle } from '@proton/shared/lib/helpers/subscription';
import { Currency, Plan, Subscription, UserModel } from '@proton/shared/lib/interfaces';

import { getCurrency } from './helpers';

const getParameters = (search: string, plans: Plan[], subscription: Subscription, user: UserModel) => {
    const params = new URLSearchParams(location.search);

    const planName = params.get('plan') || '';
    const coupon = params.get('coupon') || undefined;
    const cycleParam = parseInt(params.get('cycle') as any, 10);
    const currencyParam = params.get('currency')?.toUpperCase();
    const target = params.get('target');
    const edit = params.get('edit');
    const type = params.get('type');
    const offer = params.get('offer');

    const parsedTarget = (() => {
        if (target === 'compare') {
            return SUBSCRIPTION_STEPS.PLAN_SELECTION;
        }
        if (target === 'checkout') {
            return SUBSCRIPTION_STEPS.CHECKOUT;
        }
    })();

    const parsedCycle = cycleParam && getValidCycle(cycleParam);

    const parsedCurrency =
        currencyParam && CURRENCIES.includes(currencyParam as any) ? (currencyParam as Currency) : undefined;

    const plan = plans.find(({ Name, Type }) => Name === planName && Type === PLAN_TYPES.PLAN);

    return {
        plan,
        coupon,
        cycle: parsedCycle || subscription?.Cycle || DEFAULT_CYCLE,
        currency: parsedCurrency || getCurrency(user, subscription, plans),
        step: parsedTarget || SUBSCRIPTION_STEPS.CHECKOUT,
        disablePlanSelection: type === 'offer' || edit === 'disable',
        disableCycleSelector: edit === 'enable' ? false : type === 'offer' || Boolean(offer),
    };
};

const AutomaticSubscriptionModal = () => {
    const history = useHistory();
    const location = useLocation();

    const [open, loadingModal] = useSubscriptionModal();
    const [plans, loadingPlans] = usePlans();
    const [subscription, loadingSubscription] = useSubscription();
    const [user] = useUser();

    useLoad();

    useEffect(() => {
        if (!plans || !subscription || loadingPlans || loadingSubscription || loadingModal) {
            return;
        }

        const { plan, currency, cycle, coupon, step, disablePlanSelection, disableCycleSelector } = getParameters(
            location.search,
            plans,
            subscription,
            user
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
            disableCycleSelector,
        });
    }, [loadingPlans, loadingSubscription, loadingModal, location.search]);

    return null;
};

export default AutomaticSubscriptionModal;
