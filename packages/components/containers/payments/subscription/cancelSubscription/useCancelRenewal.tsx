import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import useApi from '@proton/components/hooks/useApi';
import useEventManager from '@proton/components/hooks/useEventManager';
import useNotifications from '@proton/components/hooks/useNotifications';
import { type FeedbackDowngradeData, Renew, changeRenewState } from '@proton/payments';
import { useIsB2BTrial } from '@proton/payments/ui';

import { OPEN_TRIAL_CANCELED_MODAL } from '../../../topBanners/constants';
import type { CancelSubscriptionResult } from './types';

const SUBSCRIPTION_CANCELLED: CancelSubscriptionResult = {
    status: 'cancelled',
};

export const useCancelRenewal = () => {
    const api = useApi();
    const eventManager = useEventManager();
    const { createNotification, hideNotification } = useNotifications();
    const [subscription] = useSubscription();
    const [organization] = useOrganization();
    const isB2BTrial = useIsB2BTrial(subscription, organization);

    const cancelSubscriptionRenewal = async (feedback: FeedbackDowngradeData, refreshState = true) => {
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
                    CancellationFeedback: feedback,
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
