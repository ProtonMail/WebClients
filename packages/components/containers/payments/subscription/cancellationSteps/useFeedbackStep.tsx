import { useUser } from '@proton/account/user/hooks';
import type { Subscription } from '@proton/payments/core/subscription/interface';

import Modal from '../../../../components/modalTwo/Modal';
import { useModalTwoPromise } from '../../../../components/modalTwo/useModalTwo';
import useCancellationTelemetry from '../cancellationFlow/useCancellationTelemetry';
import FeedbackDowngradeContent, { isKeepSubscription } from '../content/FeedbackDowngradeContent';
import type { FeedbackDowngradeFormData, FeedbackDowngradeResult } from '../content/interface';
import type { SubscriptionCancellationStep, SubscriptionCancellationStepConfig } from './types';

interface FeedbackStepKept {
    status: 'kept';
}

interface FeedbackStepCollected {
    status: 'feedback';
    feedback: FeedbackDowngradeFormData;
}

export type FeedbackStepResult = FeedbackStepKept | FeedbackStepCollected;

export const useFeedbackStep = ({
    canShow,
}: SubscriptionCancellationStepConfig): SubscriptionCancellationStep<FeedbackStepResult> => {
    const [user] = useUser();
    const [feedbackModal, showFeedbackModal] = useModalTwoPromise<
        { subscription: Subscription },
        FeedbackDowngradeResult
    >();
    const { sendFeedbackModalCancelReport, sendFeedbackModalSubmitReport } = useCancellationTelemetry();

    const modal = feedbackModal(({ subscription, onResolve, onReject, onClose, ...modalProps }) => {
        const handleResolve = (result: FeedbackDowngradeResult) => {
            if (isKeepSubscription(result)) {
                sendFeedbackModalCancelReport();
            } else {
                sendFeedbackModalSubmitReport();
            }

            onResolve(result);
        };

        return (
            <Modal data-testid="help-improve" size="xlarge" onClose={onClose} {...modalProps}>
                <FeedbackDowngradeContent
                    user={user}
                    subscription={subscription}
                    onResolve={handleResolve}
                    onClose={onClose}
                />
            </Modal>
        );
    });

    const show = async (subscription: Subscription): Promise<FeedbackStepResult> => {
        // TODO: will be addressed when skipping is required in new feedback first cancellation flow
        // issue is that if we don't want to show the modal (i.e., skipping) then that does not mean they keep the subscription.
        if (!(await canShow(subscription))) {
            return { status: 'kept' };
        }

        const result = await showFeedbackModal({ subscription });
        if (isKeepSubscription(result)) {
            return { status: 'kept' };
        }
        return { status: 'feedback', feedback: result };
    };

    return { modal, show };
};
