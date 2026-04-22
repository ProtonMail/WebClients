import { useUser } from '@proton/account/user/hooks';
import Modal from '@proton/components/components/modalTwo/Modal';
import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';
import type { FeedbackDowngradeData } from '@proton/payments/core/api/api';

import type { FeedbackDowngradeResult } from '../content/FeedbackDowngradeContent';
import FeedbackDowngradeContent, { isKeepSubscription } from '../content/FeedbackDowngradeContent';
import type { CancellationStep, CancellationStepConfig } from './types';

interface FeedbackStepKept {
    status: 'kept';
}

interface FeedbackStepCollected {
    status: 'feedback';
    feedback: FeedbackDowngradeData;
}

export type FeedbackStepResult = FeedbackStepKept | FeedbackStepCollected;

export const useFeedbackStep = ({ canShow }: CancellationStepConfig): CancellationStep<FeedbackStepResult> => {
    const [user] = useUser();
    const [feedbackModal, showFeedbackModal] = useModalTwoPromise<undefined, FeedbackDowngradeResult>();

    const modal = feedbackModal(({ onResolve, onReject, onClose, ...modalProps }) => {
        return (
            <Modal data-testid="help-improve" size="xlarge" onClose={onClose} {...modalProps}>
                <FeedbackDowngradeContent user={user} onResolve={onResolve} onClose={onClose} />
            </Modal>
        );
    });

    const show = async (): Promise<FeedbackStepResult> => {
        // TODO: will be addressed when skipping is required in new feedback first cancellation flow
        // issue is that if we don't want to show the modal (i.e., skipping) then that does not mean they keep the subscription.
        if (!(await canShow())) {
            return { status: 'kept' };
        }

        const result = await showFeedbackModal();
        if (isKeepSubscription(result)) {
            return { status: 'kept' };
        }
        return { status: 'feedback', feedback: result };
    };

    return { modal, show };
};
