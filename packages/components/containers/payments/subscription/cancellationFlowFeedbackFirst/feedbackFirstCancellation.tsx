import { useState } from 'react';

import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';

import { DifferentAccountContent } from './DifferentAccountContent';
import { BugOrQualityIssueContent } from './BugOrQualityIssueContent';
import { MissingFeatureContent } from './MissingFeatureContent';

enum CANCELLATION_STEPS {
    FEEDBACK,
    MISSING_FEATURE,
    GET_HELP,
    CONFIRM,
    DIFFERENT_ACCOUNT,
}

const FeedbackFirstCancellation = ({ ...modalProps }: ModalProps) => {
    const [step, setStep] = useState(CANCELLATION_STEPS.DIFFERENT_ACCOUNT);

    const handleKeepPlan = () => {
        modalProps.onClose?.();
    };

    const handleContinueCancelling = () => {
        setStep(CANCELLATION_STEPS.CONFIRM);
    };

    return (
        <ModalTwo className="h-full" size="xlarge" {...modalProps}>
            {step === CANCELLATION_STEPS.FEEDBACK && <div>Feedback content</div>}
            {step === CANCELLATION_STEPS.MISSING_FEATURE && (
                <MissingFeatureContent onKeepPlan={handleKeepPlan} onContinueCancelling={handleContinueCancelling} />
            )}
            {step === CANCELLATION_STEPS.DIFFERENT_ACCOUNT && (
                <DifferentAccountContent onContinueCancelling={() => undefined} onKeepPlan={() => undefined} />
            )}
            {step === CANCELLATION_STEPS.GET_HELP && (
                <BugOrQualityIssueContent onContinueCancelling={() => undefined} onKeepPlan={() => undefined} />
            )}
            {step === CANCELLATION_STEPS.CONFIRM && <div>Confirm content</div>}
        </ModalTwo>
    );
};

export default FeedbackFirstCancellation;
