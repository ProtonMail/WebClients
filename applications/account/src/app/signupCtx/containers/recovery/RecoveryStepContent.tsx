import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';

import RecoveryStepUnderstoodCheckbox from '../../../containers/recoveryPhrase/RecoveryStepUnderstoodCheckbox';
import SetRecoveryPhraseOnSignupContainer, {
    type SetRecoveryPhraseOnSignupContainerProps,
} from '../../../containers/recoveryPhrase/SetRecoveryPhraseOnSignupContainer';
import { useSignup } from '../../context/SignupContext';

interface Props {
    onContinue: () => void;
    title?: SetRecoveryPhraseOnSignupContainerProps['title'];
}

/**
 * To be used in the recovery step of the signup flow
 * If you need customisation, use this as a baseline and consume SetRecoveryPhraseOnSignupContainer yourself
 */
const RecoveryStepContent = ({ onContinue, title }: Props) => {
    const [understood, setUnderstood] = useState(false);

    const { recoveryPhraseData, sendRecoveryPhrasePayload } = useSignup();

    if (!recoveryPhraseData) {
        return null;
    }

    return (
        <SetRecoveryPhraseOnSignupContainer
            recoveryPhraseData={recoveryPhraseData}
            sendRecoveryPhrasePayload={() => sendRecoveryPhrasePayload()}
            title={title}
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
