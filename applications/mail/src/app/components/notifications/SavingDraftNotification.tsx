import React, { useState, forwardRef, useImperativeHandle, Ref } from 'react';
import { c } from 'ttag';
import { InlineLinkButton } from 'react-components';

enum SavingStep {
    saving,
    sent,
}

interface Props {
    onDiscard: () => void;
}

export interface SavingDraftNotificationAction {
    saved: () => void;
}

const SavingDraftNotification = ({ onDiscard }: Props, ref: Ref<SavingDraftNotificationAction | undefined>) => {
    const [step, setStep] = useState(SavingStep.saving);

    useImperativeHandle(ref, () => ({ saved: () => setStep(SavingStep.sent) }));

    if (step === SavingStep.sent) {
        return (
            <>
                <span className="mr1">{c('Info').t`Draft saved.`}</span>
                <InlineLinkButton onClick={onDiscard}>{c('Action').t`Discard`}</InlineLinkButton>
            </>
        );
    }

    return <>{c('Info').t`Saving draft…`}</>;
};

export default forwardRef(SavingDraftNotification);
