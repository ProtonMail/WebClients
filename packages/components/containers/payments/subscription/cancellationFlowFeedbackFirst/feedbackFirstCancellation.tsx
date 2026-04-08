import { useState } from 'react';

import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';

enum CANCELLATION_STEPS {
    FEEDBACK,
    CONFIRM,
}

const FeedbackFirstCancellation = ({ ...modalProps }: ModalProps) => {
    const [step] = useState(CANCELLATION_STEPS.FEEDBACK);

    return (
        <ModalTwo className="h-full" size="xlarge" {...modalProps}>
            {step === CANCELLATION_STEPS.FEEDBACK && <div>Feedback content</div>}
            {step === CANCELLATION_STEPS.CONFIRM && <div>Confirm content</div>}
        </ModalTwo>
    );
};

export default FeedbackFirstCancellation;
