import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { usePlans } from '@proton/account/plans/hooks';
import { useGetSubscription, useSubscription } from '@proton/account/subscription/hooks';
import { useGetUser } from '@proton/account/user/hooks';
import useNotifications from '@proton/components/hooks/useNotifications';
import {
    FREE_PLAN,
    type PLANS,
    Renew,
    type Subscription,
    getAvailableSubscriptionActions,
    getPlanName,
    hasCancellablePlan,
    isFreeSubscription,
} from '@proton/payments';
import { useIsB2BTrial } from '@proton/payments/ui';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { APPS } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';

import { useCalendarDowngradeStep } from '../cancellationSteps/useCalendarDowngradeStep';
import { useCancelConfirmationStep } from '../cancellationSteps/useCancelConfirmationStep';
import { useCancelTrialStep } from '../cancellationSteps/useCancelTrialStep';
import { useDiscountWarningStep } from '../cancellationSteps/useDiscountWarningStep';
import { useDowngradeStep } from '../cancellationSteps/useDowngradeStep';
import { useFeedbackStep } from '../cancellationSteps/useFeedbackStep';
import { useHighlightPlanDowngradeStep } from '../cancellationSteps/useHighlightPlanDowngradeStep';
import { useInAppPurchaseStep } from '../cancellationSteps/useInAppPurchaseStep';
import { useLossLoyaltyStep } from '../cancellationSteps/useLossLoyaltyStep';
import { useMemberDowngradeStep } from '../cancellationSteps/useMemberDowngradeStep';
import { usePassLaunchOfferStep } from '../cancellationSteps/usePassLaunchOfferStep';
import { useUpsellStep } from '../cancellationSteps/useUpsellStep';
import type { CancelSubscriptionResult } from './types';
import { useCancelRenewal } from './useCancelRenewal';
import { useCancellationStepEligibility } from './useCancellationStepEligibility';
import { useDeleteSubscription } from './useDeleteSubscription';

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
 * `cancellationSteps/` and action hooks (`useCancelRenewal`, `useDeleteSubscription`) directly.
 *
 * @returns {cancelSubscriptionModals, cancelSubscription}
 * cancelSubscriptionModals: the modals to display -- just render them in your component by returning them
 * cancelSubscription: the function to call to cancel the subscription.
 */
export const useCancelSubscriptionFlow = ({ app }: Props) => {
    const getSubscription = useGetSubscription();
    const getUser = useGetUser();
    const [subscription, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();
    const isB2BTrial = useIsB2BTrial(subscription, organization);
    const [plansResult, loadingPlans] = usePlans();
    const freePlan = plansResult?.freePlan || FREE_PLAN;
    const plans = plansResult?.plans ?? [];
    const currentPlanId = getPlanName(subscription);
    const isUpsellEnabled = useFlag('NewCancellationFlowUpsell');
    const canUseUpsellFlow = isUpsellEnabled && app === APPS.PROTONMAIL;

    const {
        canShowCalendarDowngrade,
        canShowDiscountWarning,
        canShowDowngrade,
        canShowLossLoyalty,
        canShowMemberDowngrade,
        canShowPassLaunchOffer,
    } = useCancellationStepEligibility();

    const cancelTrial = useCancelTrialStep({ canShow: async () => true });
    const cancelConfirmation = useCancelConfirmationStep({ canShow: async () => true });
    const upsell = useUpsellStep();
    const highlightPlanDowngrade = useHighlightPlanDowngradeStep({ canShow: async () => true });
    const inAppPurchase = useInAppPurchaseStep({ canShow: async () => true });
    const calendarDowngrade = useCalendarDowngradeStep({ canShow: canShowCalendarDowngrade });
    const lossLoyalty = useLossLoyaltyStep({ canShow: canShowLossLoyalty });
    const memberDowngrade = useMemberDowngradeStep({ canShow: canShowMemberDowngrade });
    const passLaunchOffer = usePassLaunchOfferStep({ canShow: canShowPassLaunchOffer });
    const downgrade = useDowngradeStep({ canShow: canShowDowngrade });
    const discountWarning = useDiscountWarningStep({ canShow: canShowDiscountWarning });
    const feedback = useFeedbackStep({ canShow: async () => true });
    const { deleteUserSubscription, cancellationLoadingModal } = useDeleteSubscription();
    const { cancelSubscriptionRenewal } = useCancelRenewal();

    const { createNotification } = useNotifications();

    const modals = (
        <>
            {cancelTrial.modal}
            {downgrade.modal}
            {memberDowngrade.modal}
            {lossLoyalty.modal}
            {calendarDowngrade.modal}
            {highlightPlanDowngrade.modal}
            {inAppPurchase.modal}
            {currentPlanId ? upsell.modal : null}
            {discountWarning.modal}
            {passLaunchOffer.modal}
            {cancellationLoadingModal}
            {cancelConfirmation.modal}
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
        if (!currentPlanId) {
            return SUBSCRIPTION_KEPT;
        }

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
            const feedbackResult = await feedback.show();
            if (feedbackResult.status === 'kept') {
                return SUBSCRIPTION_KEPT;
            }
            return cancelSubscriptionRenewal(feedbackResult.feedback);
        }
        return SUBSCRIPTION_UPSOLD;
    };

    interface CancelRenewProps {
        skipUpsell?: boolean;
        subscription: Subscription;
        subscriptionReminderFlow: boolean | undefined;
        upsellPlanId: PLANS | undefined;
    }

    const cancelRenew = async ({
        skipUpsell,
        subscription,
        subscriptionReminderFlow,
        upsellPlanId,
    }: CancelRenewProps): Promise<CancelSubscriptionResult> => {
        if (isB2BTrial) {
            try {
                await cancelTrial.show();
            } catch {
                return SUBSCRIPTION_KEPT;
            }
        }

        if (!isB2BTrial && !subscriptionReminderFlow) {
            if (canUseUpsellFlow && !skipUpsell) {
                return cancelWithUpsell({ subscription, upsellPlanId });
            } else {
                const result = await cancelConfirmation.show();

                if (result.status === 'kept') {
                    return SUBSCRIPTION_KEPT;
                }
            }
        }

        if (!isB2BTrial && !subscriptionReminderFlow) {
            try {
                await highlightPlanDowngrade.show({ app, cancellationFlow: true });
            } catch {
                return SUBSCRIPTION_KEPT;
            }
        }

        if (!isB2BTrial) {
            try {
                await passLaunchOffer.show();
            } catch {
                return SUBSCRIPTION_KEPT;
            }
        }

        const feedbackResult = await feedback.show();
        if (feedbackResult.status === 'kept') {
            return SUBSCRIPTION_KEPT;
        }

        return cancelSubscriptionRenewal(feedbackResult.feedback);
    };

    const handleUnsubscribe = async (subscriptionReminderFlow: boolean = false) => {
        if (!subscription) {
            return SUBSCRIPTION_KEPT;
        }

        await discountWarning.show();

        if (!subscriptionReminderFlow) {
            await highlightPlanDowngrade.show({ app, cancellationFlow: false });
        }

        await calendarDowngrade.show();
        await lossLoyalty.show();
        await memberDowngrade.show();

        if (!subscriptionReminderFlow) {
            await downgrade.show();
        }

        const feedbackResult = await feedback.show();
        if (feedbackResult.status === 'kept') {
            return SUBSCRIPTION_KEPT;
        }

        return deleteUserSubscription(feedbackResult.feedback);
    };

    const cancelSubscription = async ({
        subscriptionReminderFlow,
        upsellPlanId,
        skipUpsell,
        forceDeleteSubscription,
    }: {
        subscriptionReminderFlow?: boolean;
        upsellPlanId?: PLANS;
        skipUpsell?: boolean;
        forceDeleteSubscription?: boolean;
    }): Promise<CancelSubscriptionResult> => {
        const [subscription, user] = await Promise.all([getSubscription(), getUser()]);
        if (user.isFree || isFreeSubscription(subscription)) {
            createNotification({ type: 'error', text: c('Info').t`You already have a free account` });
            return SUBSCRIPTION_KEPT;
        }

        const subscriptionActions = getAvailableSubscriptionActions(subscription);
        if (!subscriptionActions.canCancel) {
            await inAppPurchase.show();
            return SUBSCRIPTION_KEPT;
        }

        if ((isB2BTrial || hasCancellablePlan(subscription)) && !forceDeleteSubscription) {
            if (subscription.Renew === Renew.Disabled) {
                return SUBSCRIPTION_KEPT;
            }

            return cancelRenew({
                skipUpsell,
                subscription,
                subscriptionReminderFlow,
                upsellPlanId,
            });
        }

        return handleUnsubscribe(subscriptionReminderFlow);
    };

    return {
        loadingCancelSubscription: loadingOrganization || loadingSubscription || loadingPlans,
        cancelSubscriptionModals: modals,
        cancelSubscription,
    };
};
