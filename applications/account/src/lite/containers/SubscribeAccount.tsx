import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useSubscription, useSubscriptionModal, useUser } from '@proton/components';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import { APP_NAMES } from '@proton/shared/lib/constants';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import { getUpgradedPlan } from '@proton/shared/lib/helpers/subscription';
import { canPay } from '@proton/shared/lib/user/helpers';

import broadcast, { MessageType } from '../broadcast';
import LiteBox from './LiteBox';
import LiteLoaderPage from './LiteLoaderPage';
import SubscribeAccountDone from './SubscribeAccountDone';
import { SubscribeType } from './subscribeInterface';

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
    const [open, loadingSubscriptionModal] = useSubscriptionModal();
    const [type, setType] = useState<SubscribeType | undefined>(undefined);

    const loading = loadingSubscriptionModal || loadingSubscription;

    const canEdit = canPay(user);

    useEffect(() => {
        if (onceRef.current || loading || !user) {
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

        const plan = maybeType === 'upgrade' ? getUpgradedPlan(subscription, app) : undefined;

        const maybeStep = (() => {
            if (maybeType === 'upgrade' && plan) {
                return SUBSCRIPTION_STEPS.CHECKOUT;
            }
            if (maybeStart === 'compare') {
                return SUBSCRIPTION_STEPS.PLAN_SELECTION;
            }
            if (maybeStart === 'checkout') {
                return SUBSCRIPTION_STEPS.CHECKOUT;
            }
        })();

        onceRef.current = true;
        const defaultStep = user.isFree ? SUBSCRIPTION_STEPS.PLAN_SELECTION : SUBSCRIPTION_STEPS.CUSTOMIZATION;
        open({
            step: maybeStep || defaultStep,
            onClose: handleClose,
            onSuccess: handleSuccess,
            plan: plan,
            fullscreen,
            disableThanksStep: true,
        });
    }, [user, loading]);

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

    if (!canEdit) {
        return (
            <LiteBox>
                {c('Info').t`Please contact the administrator of the organisation to manage the subscription.`}
            </LiteBox>
        );
    }

    return null;
};

export default SubscribeAccount;
