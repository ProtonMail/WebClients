import { useEffect, useRef, useState } from 'react';

import { usePlans, useSubscription, useSubscriptionModal, useUser } from '@proton/components';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import { APP_NAMES, PLAN_TYPES } from '@proton/shared/lib/constants';
import { PLANS } from '@proton/shared/lib/constants';
import { DEFAULT_CYCLE } from '@proton/shared/lib/constants';
import { CURRENCIES } from '@proton/shared/lib/constants';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import { getUpgradedPlan, getValidCycle } from '@proton/shared/lib/helpers/subscription';
import { Currency } from '@proton/shared/lib/interfaces';
import { canPay } from '@proton/shared/lib/user/helpers';

import broadcast, { MessageType } from '../broadcast';
import LiteBox from '../components/LiteBox';
import LiteLoaderPage from '../components/LiteLoaderPage';
import SubscribeAccountDone from '../components/SubscribeAccountDone';
import { SubscribeType } from '../types/SubscribeType';

interface Props {
    redirect?: string | undefined;
    fullscreen?: boolean;
    queryParams: URLSearchParams;
    app: APP_NAMES;
}

const SubscribeAccount = ({ app, redirect, fullscreen, queryParams }: Props) => {
    const onceRef = useRef(false);
    const onceCloseRef = useRef(false);
    const [user] = useUser();
    const [subscription, loadingSubscription] = useSubscription();
    const [plans, loadingPlans] = usePlans();
    const [open, loadingSubscriptionModal] = useSubscriptionModal();
    const [type, setType] = useState<SubscribeType | undefined>(undefined);

    const loading = loadingSubscriptionModal || loadingSubscription;

    const canEdit = canPay(user);

    useEffect(() => {
        if (onceRef.current || loading || !user || !plans) {
            return;
        }
        // Only certain users can manage subscriptions
        if (!canEdit) {
            return;
        }

        const handleNotify = (type: SubscribeType) => {
            if (onceCloseRef.current) {
                return;
            }
            setType(type);
            onceCloseRef.current = true;
            if (redirect) {
                replaceUrl(redirect);
                return;
            }
            broadcast({ type: MessageType.CLOSE });
        };

        const handleClose = () => {
            handleNotify(SubscribeType.Closed);
        };

        const handleSuccess = () => {
            handleNotify(SubscribeType.Subscribed);
        };

        const maybeStart = queryParams.get('start');
        const maybeType = queryParams.get('type');
        const maybeDisableCycleSelector = queryParams.get('disableCycleSelector');

        const cycleParam = parseInt(queryParams.get('cycle') as any, 10);
        const parsedCycle = cycleParam && getValidCycle(cycleParam);
        const coupon = queryParams.get('coupon') || undefined;

        const currencyParam = queryParams.get('currency')?.toUpperCase();
        const parsedCurrency =
            currencyParam && CURRENCIES.includes(currencyParam as any) ? (currencyParam as Currency) : undefined;

        const maybePlanName = queryParams.get('plan') || '';
        const plan =
            maybeType === 'upgrade'
                ? getUpgradedPlan(subscription, app)
                : (plans.find(({ Name, Type }) => Name === maybePlanName && Type === PLAN_TYPES.PLAN)?.Name as
                      | PLANS
                      | undefined);

        const step = (() => {
            if (maybeStart === 'compare') {
                return SUBSCRIPTION_STEPS.PLAN_SELECTION;
            }
            if (maybeStart === 'checkout') {
                return SUBSCRIPTION_STEPS.CHECKOUT;
            }
            if (maybeType === 'upgrade' && plan) {
                return SUBSCRIPTION_STEPS.PLAN_SELECTION;
            }
            return user.isFree ? SUBSCRIPTION_STEPS.PLAN_SELECTION : SUBSCRIPTION_STEPS.CUSTOMIZATION;
        })();

        onceRef.current = true;
        open({
            step,
            onClose: handleClose,
            onSuccess: handleSuccess,
            plan: plan,
            coupon,
            cycle: parsedCycle || subscription?.Cycle || DEFAULT_CYCLE,
            currency: parsedCurrency,
            fullscreen,
            disableThanksStep: true,
            disableCycleSelector: Boolean(maybeDisableCycleSelector),
            metrics: {
                source: 'lite-subscribe',
            },
        });
    }, [user, loading, loadingPlans]);

    if (loading) {
        return <LiteLoaderPage />;
    }

    if (type === SubscribeType.Subscribed || type === SubscribeType.Closed) {
        return (
            <LiteBox>
                <SubscribeAccountDone type={type} />
            </LiteBox>
        );
    }

    // Error in usage (this action is not meant to be shown if it cannot be triggered, so untranslated.
    if (!canEdit) {
        return <LiteBox>Please contact the administrator of the organization to manage the subscription</LiteBox>;
    }

    return null;
};

export default SubscribeAccount;
