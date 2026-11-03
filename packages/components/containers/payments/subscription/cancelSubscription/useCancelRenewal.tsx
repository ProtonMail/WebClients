import { c } from 'ttag';

import { useEntitlementCatalog } from '@proton/account/entitlementCatalog/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import { changeRenewState } from '@proton/payments/core/api/api';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { getTrialInfoForSingleSubscription } from '@proton/payments/core/trials';
import { Renew } from '@proton/shared/lib/payments/subscription/constants';

import useEventManager from '../../../../hooks/useEventManager';
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
    const [entitlementCatalog] = useEntitlementCatalog();

    const cancelSubscriptionRenewal = async (
        subscription: Subscription,
        feedback: FeedbackDowngradeFormData,
        refreshState = true
    ) => {
        const { isB2BTrial } = getTrialInfoForSingleSubscription(entitlementCatalog, subscription);
        let cancelNotificationId;

        try {
            cancelNotificationId = createNotification({
                type: 'info',
                text: c('State').t`Canceling your subscription, please wait`,
                expiration: 99999,
            });

            await api(
                changeRenewState(
                    {
                        RenewalState: Renew.Disabled,
                        CancellationFeedback: {
                            Reason: feedback.Reason || null,
                            Feedback: feedback.Feedback || null,
                            ReasonDetails: feedback.ReasonDetails || null,
                            Context: feedback.Context,
                        },
                    },
                    subscription.ID
                )
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
