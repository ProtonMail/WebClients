import { c } from 'ttag';

import { type FeedbackDowngradeData, deleteSubscription } from '@proton/payments/core/api/api';

import useApi from '../../../../hooks/useApi';
import useEventManager from '../../../../hooks/useEventManager';
import useNotifications from '../../../../hooks/useNotifications';
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
            await api(deleteSubscription(feedback));
            await eventManager.call();
            createNotification({ text: c('Success').t`You have successfully unsubscribed` });
            return SUBSCRIPTION_DOWNGRADED;
        } finally {
            cancellationLoading.hide();
        }
    };

    return { deleteUserSubscription, cancellationLoadingModal: cancellationLoading.modal };
};
