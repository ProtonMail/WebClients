import { c } from 'ttag';

import { changeRenewState } from '@proton/shared/lib/api/payments';
import { Renew, SubscriptionModel, UserModel } from '@proton/shared/lib/interfaces';

import { useModalTwo } from '../../../../components/modalTwo';
import { useApi, useEventManager, useNotifications } from '../../../../hooks';
import FeedbackDowngradeModal, {
    FeedbackDowngradeModalProps,
    FeedbackDowngradeResult,
    isKeepSubscription,
} from '../FeedbackDowngradeModal';
import { CancelSubscriptionModal, CancelSubscriptionModalProps } from './CancelSubscriptionModal';
import { CancelSubscriptionResult } from './types';

const SUBSCRIPTION_KEPT: CancelSubscriptionResult = {
    status: 'kept',
};

export interface UseCancelSubscriptionFlowProps {
    subscription: SubscriptionModel;
    user: UserModel;
}

/**
 * This hook will handle cancellation flow. It will display the cancellation modal and the feedback modal.
 * Use this hook if you need to implement cancellation flow elsewhere. It will help to be consistent in terms of UX
 * and expectations of the internal stakeholders.
 * @returns {cancelSubscriptionModals, cancelSubscription}
 * cancelSubscriptionModals: the modals to display – just render them in your component by returning them
 * cancelSubscription: the function to call to cancel the subscription.
 */
export const useCancelSubscriptionFlow = ({ subscription, user }: UseCancelSubscriptionFlowProps) => {
    const api = useApi();
    const eventManager = useEventManager();

    const [cancelSubscriptionModal, showCancelSubscriptionModal] = useModalTwo<
        CancelSubscriptionModalProps,
        CancelSubscriptionResult
    >(CancelSubscriptionModal);
    const [feedbackDowngradeModal, showFeedbackDowngradeModal] = useModalTwo<
        FeedbackDowngradeModalProps,
        FeedbackDowngradeResult
    >(FeedbackDowngradeModal);
    const { createNotification, hideNotification } = useNotifications();

    const modals = (
        <>
            {cancelSubscriptionModal}
            {feedbackDowngradeModal}
        </>
    );

    const cancelSubscription = async (): Promise<CancelSubscriptionResult> => {
        if (!subscription || !user) {
            return SUBSCRIPTION_KEPT;
        }

        const result = await showCancelSubscriptionModal({
            subscription,
        });
        if (result.status === 'kept') {
            return SUBSCRIPTION_KEPT;
        }

        const feedback = await showFeedbackDowngradeModal({ user });
        if (isKeepSubscription(feedback)) {
            return SUBSCRIPTION_KEPT;
        }

        const cancelNotificationId = createNotification({
            type: 'info',
            text: c('State').t`Cancelling your subscription, please wait`,
            expiration: 99999,
        });

        try {
            await api(
                changeRenewState({
                    RenewalState: Renew.Disabled,
                    CancellationFeedback: feedback,
                })
            );
            await eventManager.call();
            createNotification({ text: c('Success').t`You have successfully cancelled your subscription.` });
        } finally {
            hideNotification(cancelNotificationId);
        }

        return result;
    };

    return {
        cancelSubscriptionModals: modals,
        cancelSubscription,
    };
};
