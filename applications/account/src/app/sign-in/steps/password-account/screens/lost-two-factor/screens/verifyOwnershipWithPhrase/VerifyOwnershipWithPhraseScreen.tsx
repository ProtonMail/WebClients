import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Form from '@proton/components/components/form/Form';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import MnemonicInputField, {
    useMnemonicInputValidation,
} from '@proton/components/containers/mnemonic/MnemonicInputField';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import type { SignInScreen, SignInScreenProps } from '../../../../../../routes/signInRoute';
import { useSignInProps } from '../../../../../../wizard/SignInProvider';
import { getDisableTwoFactorTitle } from '../../DisableTwoFactorTitle';
import { Lost2FAContext } from '../../Lost2FAContext';
import { Lost2FAUsername } from '../../Lost2FAUsername';
import { selectSubmitting } from '../../state-machine/lost2FAStateMachine';
import { useLost2FATelemetry } from '../../useLost2FATelemetry';

export const VerifyOwnershipWithPhraseScreen: SignInScreen = ({ onBack }: SignInScreenProps) => {
    const { layout } = useSignInProps();
    const actorRef = Lost2FAContext.useActorRef();
    const submitting = Lost2FAContext.useSelector(selectSubmitting);

    const { sendStepLoad } = useLost2FATelemetry();
    useEffect(() => {
        sendStepLoad('verify ownership with phrase');
    }, []);

    const { validator, onFormSubmit } = useFormErrors();
    const [phrase, setPhrase] = useState('');
    const phraseValidation = useMnemonicInputValidation(phrase);

    return (
        <>
            <layout.Header title={getDisableTwoFactorTitle()} subTitle={<Lost2FAUsername />} onBack={onBack} />
            <layout.Body>
                <Form
                    onSubmit={() => {
                        if (!submitting && onFormSubmit()) {
                            actorRef.send({ type: 'verification.phraseSubmitted', payload: { phrase } });
                        }
                    }}
                >
                    <div className="mb-4">
                        {c('Info')
                            .t`Enter your recovery phrase to verify your identity and disable two-factor authentication.`}
                    </div>
                    <MnemonicInputField
                        disableChange={submitting}
                        value={phrase}
                        onValue={setPhrase}
                        autoFocus
                        error={validator([requiredValidator(phrase), ...phraseValidation])}
                    />
                    <Button
                        size="large"
                        color="danger"
                        type="submit"
                        fullWidth
                        loading={submitting}
                        className="mb-2 mt-4"
                    >
                        {c('Action').t`Disable`}
                    </Button>
                    <Button
                        size="large"
                        fullWidth
                        onClick={() => actorRef.send({ type: 'lost2FA.otherMethodRequested' })}
                    >
                        {c('Action').t`Verify another way`}
                    </Button>
                </Form>
            </layout.Body>
        </>
    );
};
