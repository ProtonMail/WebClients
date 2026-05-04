import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import RecoveryStepUnderstoodCheckbox from '../../../containers/recoveryPhrase/RecoveryStepUnderstoodCheckbox';
import SetRecoveryPhraseOnSignupContainer from '../../../containers/recoveryPhrase/SetRecoveryPhraseOnSignupContainer';
import { useSignup } from '../../context/SignupContext';

interface Props {
    onContinue: () => void;
}

/**
 * To be used in the recovery step of the signup flow
 * If you need customisation, use this as a baseline and consume SetRecoveryPhraseOnSignupContainer yourself
 */
const RecoveryStepContent = ({ onContinue }: Props) => {
    const [understood, setUnderstood] = useState(false);

    const { recoveryPhraseData, sendRecoveryPhrasePayload, captureSignupSentryMessage } = useSignup();

    useEffect(() => {
        if (!recoveryPhraseData) {
            captureSignupSentryMessage('Recovery phrase data is missing. Skipping step.');
            /**
             * Recovery data has not been setup. We should gracefully handle and skip this step
             */
            onContinue();
        }
    }, [recoveryPhraseData]);

    if (!recoveryPhraseData) {
        return null;
    }

    return (
        <SetRecoveryPhraseOnSignupContainer
            recoveryPhraseData={recoveryPhraseData}
            sendRecoveryPhrasePayload={() => sendRecoveryPhrasePayload()}
            title={
                <h1 className="font-arizona text-semibold text-8xl mb-4">
                    {c('RecoveryPhrase: Title').t`Save your recovery phrase`}
                </h1>
            }
            continueButton={() => {
                return (
                    <>
                        <RecoveryStepUnderstoodCheckbox
                            className="w-full"
                            checked={understood}
                            onChange={() => setUnderstood(!understood)}
                        />
                        <Button color="norm" size="large" pill fullWidth disabled={!understood} onClick={onContinue}>
                            {c('RecoveryPhrase: Action').t`Continue`}
                        </Button>
                    </>
                );
            }}
        />
    );
};

export default RecoveryStepContent;
