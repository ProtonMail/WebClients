import React, { useState, forwardRef, useImperativeHandle, Ref } from 'react';
import { c } from 'ttag';
import { LinkButton } from 'react-components';

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
                <span className="mr1">{c('Info').t`Draft saved`}</span>
                <LinkButton className="align-baseline p0 text-no-decoration text-bold" onClick={onDiscard}>{c('Action')
                    .t`Discard`}</LinkButton>
            </>
        );
    }

    return <>{c('Info').t`Saving draft...`}</>;
};

export default forwardRef(SavingDraftNotification);
