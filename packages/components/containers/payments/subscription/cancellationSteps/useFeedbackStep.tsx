import { useUser } from '@proton/account/user/hooks';

import Modal from '../../../../components/modalTwo/Modal';
import { useModalTwoPromise } from '../../../../components/modalTwo/useModalTwo';
import useCancellationTelemetry from '../cancellationFlow/useCancellationTelemetry';
import FeedbackDowngradeContent, { isKeepSubscription } from '../content/FeedbackDowngradeContent';
import type { FeedbackDowngradeFormData, FeedbackDowngradeResult } from '../content/interface';
import type { CancellationStep, CancellationStepConfig } from './types';

interface FeedbackStepKept {
    status: 'kept';
}

interface FeedbackStepCollected {
    status: 'feedback';
    feedback: FeedbackDowngradeFormData;
}

export type FeedbackStepResult = FeedbackStepKept | FeedbackStepCollected;

export const useFeedbackStep = ({ canShow }: CancellationStepConfig): CancellationStep<FeedbackStepResult> => {
    const [user] = useUser();
    const [feedbackModal, showFeedbackModal] = useModalTwoPromise<undefined, FeedbackDowngradeResult>();
    const { sendFeedbackModalCancelReport, sendFeedbackModalSubmitReport } = useCancellationTelemetry();

    const modal = feedbackModal(({ onResolve, onReject, onClose, ...modalProps }) => {
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
                <FeedbackDowngradeContent user={user} onResolve={handleResolve} onClose={onClose} />
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
