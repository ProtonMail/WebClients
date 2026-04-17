import { useUser } from '@proton/account/user/hooks';
import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';
import type { FeedbackDowngradeData } from '@proton/payments/core/api/api';

import type { FeedbackDowngradeResult } from '../FeedbackDowngradeModal';
import FeedbackDowngradeModal, { isKeepSubscription } from '../FeedbackDowngradeModal';
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

    const modal = feedbackModal((props) => {
        return <FeedbackDowngradeModal user={user} {...props} />;
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
