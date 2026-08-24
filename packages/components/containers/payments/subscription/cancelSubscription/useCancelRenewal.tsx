import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { changeRenewState } from '@proton/payments/core/api/api';
import { Renew } from '@proton/payments/core/subscription/constants';
import { getTrialInfoForSingleSubscription } from '@proton/payments/core/trials';

import useApi from '../../../../hooks/useApi';
import useEventManager from '../../../../hooks/useEventManager';
import useNotifications from '../../../../hooks/useNotifications';
import { OPEN_TRIAL_CANCELED_MODAL } from '../../../topBanners/constants';
import type { FeedbackDowngradeFormData } from '../content/interface';
import type { CancelSubscriptionResult } from './types';

const SUBSCRIPTION_CANCELLED: CancelSubscriptionResult = {
    status: 'cancelled',
};

export const useCancelRenewal = () => {
    const api = useApi();
    const eventManager = useEventManager();
    const { createNotification, hideNotification } = useNotifications();
    const [subscription] = useSubscription();
    const { isB2BTrial } = getTrialInfoForSingleSubscription(subscription);

    const cancelSubscriptionRenewal = async (feedback: FeedbackDowngradeFormData, refreshState = true) => {
        let cancelNotificationId;

        try {
            cancelNotificationId = createNotification({
                type: 'info',
                text: c('State').t`Canceling your subscription, please wait`,
                expiration: 99999,
            });

            await api(
                changeRenewState({
                    RenewalState: Renew.Disabled,
                    CancellationFeedback: {
                        Reason: feedback.Reason || null,
                        Feedback: feedback.Feedback || null,
                        ReasonDetails: feedback.ReasonDetails || null,
                        Context: feedback.Context,
                    },
                })
            );
            if (refreshState) {
                await eventManager.call();
            }

            if (!isB2BTrial) {
                createNotification({ text: c('Success').t`You have successfully canceled your subscription.` });
            }
        } finally {
            if (cancelNotificationId) {
                hideNotification(cancelNotificationId);
            }
        }

        if (isB2BTrial) {
            document.dispatchEvent(new CustomEvent(OPEN_TRIAL_CANCELED_MODAL));
        }

        return SUBSCRIPTION_CANCELLED;
    };

    return { cancelSubscriptionRenewal };
};
