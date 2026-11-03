import { c } from 'ttag';

import { useGetAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { useEntitlementCatalog } from '@proton/account/entitlementCatalog/hooks';
import { usePlans } from '@proton/account/plans/hooks';
import { useGetUser } from '@proton/account/user/hooks';
import { useNotifications } from '@proton/app-context/useNotifications';
import type { PLANS } from '@proton/payments/core/constants';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import {
    type MaybeFreeSubscription,
    getAvailableSubscriptionActions,
    hasCancellablePlan,
    hasPassLaunchOffer,
} from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { getTrialInfoForSingleSubscription } from '@proton/payments/core/trials';
import { isPaidSubscription } from '@proton/payments/core/type-guards';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { APPS } from '@proton/shared/lib/constants';
import { Renew } from '@proton/shared/lib/payments/subscription/constants';
import { useFlag } from '@proton/unleash/useFlag';

import { useCancelConfirmationStep } from '../cancellationSteps/useCancelConfirmationStep';
import { useCancelTrialStep } from '../cancellationSteps/useCancelTrialStep';
import { useCancelViaSupportStep } from '../cancellationSteps/useCancelViaSupportStep';
import { useFeedbackStep } from '../cancellationSteps/useFeedbackStep';
import { useHighlightPlanDowngradeStep } from '../cancellationSteps/useHighlightPlanDowngradeStep';
import { useInAppPurchaseStep } from '../cancellationSteps/useInAppPurchaseStep';
import { usePassLaunchOfferStep } from '../cancellationSteps/usePassLaunchOfferStep';
import { useUpsellStep } from '../cancellationSteps/useUpsellStep';
import type { CancelSubscriptionResult } from './types';
import { useCancelRenewal } from './useCancelRenewal';

const SUBSCRIPTION_KEPT: CancelSubscriptionResult = {
    status: 'kept',
};

const SUBSCRIPTION_CANCELLED: CancelSubscriptionResult = {
    status: 'cancelled',
};

const SUBSCRIPTION_UPSOLD: CancelSubscriptionResult = {
    status: 'upsold',
};

interface Props {
    app: ProductParam;
}

/**
 * This hook will handle cancellation flow. It will display the cancellation modal and the feedback modal.
 * Use this hook if you need to implement cancellation flow elsewhere. It will help to be consistent in terms of UX
 * and expectations of the internal stakeholders.
 *
 * For building custom cancellation flows, consider using the individual step hooks from
 * `cancellationSteps/` and the `useCancelRenewal` action hook directly.
 *
 * @returns {cancelSubscriptionModals, cancelSubscription}
 * cancelSubscriptionModals: the modals to display -- just render them in your component by returning them
 * cancelSubscription: the function to call to cancel the subscription.
 */
export const useCancelSubscriptionFlow = ({ app }: Props) => {
    const getAllSubscriptions = useGetAllSubscriptions();
    const getUser = useGetUser();
    const [entitlementCatalog, loadingEntitlementCatalog] = useEntitlementCatalog();
    const [plansResult, loadingPlans] = usePlans();
    const freePlan = plansResult?.freePlan || FREE_PLAN;
    const plans = plansResult?.plans ?? [];
    const isUpsellEnabled = useFlag('NewCancellationFlowUpsell');
    const canUseUpsellFlow = isUpsellEnabled && app === APPS.PROTONMAIL;

    const cancelTrial = useCancelTrialStep({ canShow: async () => true });
    const cancelConfirmation = useCancelConfirmationStep({ canShow: async () => true });
    const cancelViaSupport = useCancelViaSupportStep({ canShow: async () => true });
    const upsell = useUpsellStep();
    const highlightPlanDowngrade = useHighlightPlanDowngradeStep({ canShow: async () => true });
    const inAppPurchase = useInAppPurchaseStep({ canShow: async () => true });
    const passLaunchOffer = usePassLaunchOfferStep({
        canShow: async (subscription) => hasPassLaunchOffer(subscription),
    });
    const feedback = useFeedbackStep({ canShow: async () => true });
    const { cancelSubscriptionRenewal } = useCancelRenewal();

    const { createNotification } = useNotifications();

    const modals = (
        <>
            {cancelTrial.modal}
            {highlightPlanDowngrade.modal}
            {inAppPurchase.modal}
            {upsell.modal}
            {passLaunchOffer.modal}
            {cancelConfirmation.modal}
            {cancelViaSupport.modal}
            {feedback.modal}
        </>
    );

    interface CancelWithUpsellProps {
        subscription: Subscription;
        upsellPlanId: PLANS | undefined;
    }

    const cancelWithUpsell = async ({
        subscription,
        upsellPlanId,
    }: CancelWithUpsellProps): Promise<CancelSubscriptionResult> => {
        const resolution = upsellPlanId
            ? await upsell.show({
                  freePlan,
                  plans,
                  subscription,
                  upsellPlanId,
              })
            : SUBSCRIPTION_CANCELLED;

        if (resolution.status === SUBSCRIPTION_KEPT.status) {
            return SUBSCRIPTION_KEPT;
        }

        if (resolution.status === SUBSCRIPTION_CANCELLED.status) {
            const feedbackResult = await feedback.show(subscription);
            if (feedbackResult.status === 'kept') {
                return SUBSCRIPTION_KEPT;
            }
            return cancelSubscriptionRenewal(subscription, feedbackResult.feedback);
        }
        return SUBSCRIPTION_UPSOLD;
    };

    interface CancelRenewProps {
        isB2BTrial: boolean;
        skipUpsell?: boolean;
        subscription: Subscription;
        subscriptionReminderFlow: boolean | undefined;
        upsellPlanId: PLANS | undefined;
    }

    const cancelRenew = async ({
        isB2BTrial,
        skipUpsell,
        subscription,
        subscriptionReminderFlow,
        upsellPlanId,
    }: CancelRenewProps): Promise<CancelSubscriptionResult> => {
        if (isB2BTrial) {
            try {
                await cancelTrial.show(subscription);
            } catch {
                return SUBSCRIPTION_KEPT;
            }
        }

        if (!isB2BTrial && !subscriptionReminderFlow) {
            if (canUseUpsellFlow && !skipUpsell) {
                return cancelWithUpsell({ subscription, upsellPlanId });
            } else {
                const result = await cancelConfirmation.show(subscription);

                if (result.status === 'kept') {
                    return SUBSCRIPTION_KEPT;
                }
            }
        }

        if (!isB2BTrial && !subscriptionReminderFlow) {
            try {
                await highlightPlanDowngrade.show({ app, subscription });
            } catch {
                return SUBSCRIPTION_KEPT;
            }
        }

        if (!isB2BTrial) {
            try {
                await passLaunchOffer.show(subscription);
            } catch {
                return SUBSCRIPTION_KEPT;
            }
        }

        const feedbackResult = await feedback.show(subscription);
        if (feedbackResult.status === 'kept') {
            return SUBSCRIPTION_KEPT;
        }

        return cancelSubscriptionRenewal(subscription, feedbackResult.feedback);
    };

    const getLatestSubscription = async (subscription: MaybeFreeSubscription) => {
        if (!isPaidSubscription(subscription)) {
            return undefined;
        }

        const subscriptions = await getAllSubscriptions();
        return subscriptions.find(({ ID }) => ID === subscription.ID);
    };

    const cancelSubscription = async ({
        subscription: targetSubscription,
        subscriptionReminderFlow,
        upsellPlanId,
        skipUpsell,
    }: {
        subscription: MaybeFreeSubscription;
        subscriptionReminderFlow?: boolean;
        upsellPlanId?: PLANS;
        skipUpsell?: boolean;
    }): Promise<CancelSubscriptionResult> => {
        const [subscription, user] = await Promise.all([getLatestSubscription(targetSubscription), getUser()]);
        if (user.isFree || !subscription) {
            createNotification({ type: 'error', text: c('Info').t`You already have a free account` });
            return SUBSCRIPTION_KEPT;
        }

        const subscriptionActions = getAvailableSubscriptionActions(subscription);
        if (!subscriptionActions.canCancel) {
            await inAppPurchase.show(subscription);
            return SUBSCRIPTION_KEPT;
        }

        const { isB2BTrial } = getTrialInfoForSingleSubscription(entitlementCatalog, subscription);
        if (!isB2BTrial && !hasCancellablePlan(subscription)) {
            await cancelViaSupport.show();
            return SUBSCRIPTION_KEPT;
        }

        if (subscription.Renew === Renew.Disabled) {
            return SUBSCRIPTION_KEPT;
        }

        return cancelRenew({
            isB2BTrial,
            skipUpsell,
            subscription,
            subscriptionReminderFlow,
            upsellPlanId,
        });
    };

    return {
        loadingCancelSubscription: loadingPlans || loadingEntitlementCatalog,
        cancelSubscriptionModals: modals,
        cancelSubscription,
    };
};
