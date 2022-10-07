import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import { useSubscription, useSubscriptionModal, useUser } from '@proton/components';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import { APP_NAMES } from '@proton/shared/lib/constants';
import { getUpgradedPlan } from '@proton/shared/lib/helpers/subscription';
import { canPay } from '@proton/shared/lib/user/helpers';

import broadcast, { MessageType } from '../broadcast';

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

        const handleClose = () => {
            if (onceCloseRef.current) {
                return;
            }

            onceCloseRef.current = true;

            if (redirect && /^(\/$|\/[^/]|proton(vpn|mail|drive)?:\/\/)/.test(redirect)) {
                document.location.replace(redirect);
                return;
            }

            broadcast({ type: MessageType.CLOSE });
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
            onSuccess: handleClose,
            plan: plan,
            fullscreen,
            disableThanksStep: true,
        });
    }, [user, loading]);

    return (
        <div className="h100 ui-prominent">
            {!canEdit ? (
                <div className="flex flex-justify-center flex-align-items-center h100">
                    {c('Action').t`Please contact the administrator of the organisation to manage the subscription`}
                </div>
            ) : null}
        </div>
    );
};

export default SubscribeAccount;
