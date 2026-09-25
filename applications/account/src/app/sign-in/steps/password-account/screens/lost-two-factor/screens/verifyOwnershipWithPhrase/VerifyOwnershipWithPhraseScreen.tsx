import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Form from '@proton/components/components/form/Form';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import MnemonicInputField, {
    useMnemonicInputValidation,
} from '@proton/components/containers/mnemonic/MnemonicInputField';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import { Lost2FAContext } from '../../Lost2FAContext';
import { Lost2FAStepLayout } from '../../Lost2FAStepLayout';
import { Lost2FAStateMachineTags } from '../../state-machine/lost2FAStateMachine';
import { useLost2FATelemetry } from '../../useLost2FATelemetry';

const VerifyOwnershipWithPhraseContent = () => {
    const actorRef = Lost2FAContext.useActorRef();
    const submitting = Lost2FAContext.useSelector((snapshot) => snapshot.hasTag(Lost2FAStateMachineTags.submitting));

    const { sendStepLoad } = useLost2FATelemetry();
    useEffect(() => {
        sendStepLoad('verify ownership with phrase');
    }, []);

    const { validator, onFormSubmit } = useFormErrors();
    const [phrase, setPhrase] = useState('');
    const phraseValidation = useMnemonicInputValidation(phrase);

    return (
        <Form
            onSubmit={() => {
                if (!submitting && onFormSubmit()) {
                    actorRef.send({ type: 'verification.phraseSubmitted', phrase });
                }
            }}
        >
            <div className="mb-4">
                {c('Info').t`Enter your recovery phrase to verify your identity and disable two-factor authentication.`}
            </div>
            <MnemonicInputField
                disableChange={submitting}
                value={phrase}
                onValue={setPhrase}
                autoFocus
                error={validator([requiredValidator(phrase), ...phraseValidation])}
            />
            <Button size="large" color="danger" type="submit" fullWidth loading={submitting} className="mb-2 mt-4">
                {c('Action').t`Disable`}
            </Button>
            <Button size="large" fullWidth onClick={() => actorRef.send({ type: 'lost2FA.otherMethodRequested' })}>
                {c('Action').t`Verify another way`}
            </Button>
        </Form>
    );
};

export const VerifyOwnershipWithPhraseScreen = () => (
    <Lost2FAStepLayout title={c('Title').t`Disable two-factor authentication?`}>
        <VerifyOwnershipWithPhraseContent />
    </Lost2FAStepLayout>
);
