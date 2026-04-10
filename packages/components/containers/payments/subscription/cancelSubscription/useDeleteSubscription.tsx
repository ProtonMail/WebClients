import { c } from 'ttag';

import useApi from '@proton/components/hooks/useApi';
import useEventManager from '@proton/components/hooks/useEventManager';
import useNotifications from '@proton/components/hooks/useNotifications';
import { type FeedbackDowngradeData, deleteSubscription } from '@proton/payments';

import { useCancellationLoadingStep } from '../cancellationSteps/useCancellationLoadingStep';
import type { CancelSubscriptionResult } from './types';

const SUBSCRIPTION_DOWNGRADED: CancelSubscriptionResult = {
    status: 'downgraded',
};

export const useDeleteSubscription = () => {
    const api = useApi();
    const eventManager = useEventManager();
    const { createNotification } = useNotifications();
    const cancellationLoading = useCancellationLoadingStep();

    const deleteUserSubscription = async (feedback: FeedbackDowngradeData): Promise<CancelSubscriptionResult> => {
        try {
            cancellationLoading.show();
            await api(deleteSubscription(feedback, 'v5'));
            await eventManager.call();
            createNotification({ text: c('Success').t`You have successfully unsubscribed` });
            return SUBSCRIPTION_DOWNGRADED;
        } finally {
            cancellationLoading.hide();
        }
    };

    return { deleteUserSubscription, cancellationLoadingModal: cancellationLoading.modal };
};
