import { useState } from 'react';

import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';

import { MissingFeatureContent } from './MissingFeatureContent';

enum CANCELLATION_STEPS {
    FEEDBACK,
    MISSING_FEATURE,
    CONFIRM,
}

const FeedbackFirstCancellation = ({ ...modalProps }: ModalProps) => {
    const [step, setStep] = useState(CANCELLATION_STEPS.MISSING_FEATURE);

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
            {step === CANCELLATION_STEPS.CONFIRM && <div>Confirm content</div>}
        </ModalTwo>
    );
};

export default FeedbackFirstCancellation;
