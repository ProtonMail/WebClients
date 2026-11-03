import type { Subscription } from '@proton/payments/core/subscription/interface';

import { useModalTwoPromise } from '../../../../components/modalTwo/useModalTwo';
import { CancelSubscriptionModal } from '../cancelSubscription/CancelSubscriptionModal';
import type { CancelSubscriptionResult } from '../cancelSubscription/types';
import type { SubscriptionCancellationStep, SubscriptionCancellationStepConfig } from './types';

export const useCancelConfirmationStep = ({
    canShow,
}: SubscriptionCancellationStepConfig): SubscriptionCancellationStep<CancelSubscriptionResult> => {
    const [cancelSubscriptionModal, showCancelSubscriptionModal] = useModalTwoPromise<
        { subscription: Subscription },
        CancelSubscriptionResult
    >();

    const modal = cancelSubscriptionModal((props) => {
        return <CancelSubscriptionModal {...props} />;
    });

    const show = async (subscription: Subscription) => {
        if (!(await canShow(subscription))) {
            return { status: 'kept' as const };
        }

        return showCancelSubscriptionModal({ subscription });
    };

    return { modal, show };
};
