import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import { LinkButton } from 'react-components';

enum SavingStep {
    saving,
    sent,
}

interface Props {
    promise: Promise<any>;
    onDiscard: () => void;
}

const SavingDraftNotification = ({ promise, onDiscard }: Props) => {
    const [step, setStep] = useState(SavingStep.saving);

    useEffect(() => {
        void promise.then(() => setStep(SavingStep.sent));
    }, []);

    if (step === SavingStep.sent) {
        return (
            <>
                <span className="mr1">{c('Info').t`Draft saved`}</span>
                <LinkButton
                    className="align-baseline p0 text-no-decoration text-bold button--currentColor"
                    onClick={onDiscard}
                >{c('Action').t`Discard`}</LinkButton>
            </>
        );
    }

    return <>{c('Info').t`Saving draft...`}</>;
};

export default SavingDraftNotification;
