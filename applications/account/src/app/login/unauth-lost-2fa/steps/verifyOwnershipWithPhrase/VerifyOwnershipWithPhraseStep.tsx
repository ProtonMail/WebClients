import { useEffect, useState } from 'react';

import { useSelector } from '@xstate/react';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import MnemonicInputField, {
    useMnemonicInputValidation,
} from '@proton/components/containers/mnemonic/MnemonicInputField';
import { Form, useApi, useErrorHandler, useFormErrors } from '@proton/components/index';
import useLoading from '@proton/hooks/useLoading';
import { getMnemonicAuthInfo, reauthMnemonic } from '@proton/shared/lib/api/auth';
import { disable2FA } from '@proton/shared/lib/api/settings';
import type { InfoResponse } from '@proton/shared/lib/authentication/interface';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { mnemonicToBase64RandomBytes } from '@proton/shared/lib/mnemonic';
import { srpAuth } from '@proton/shared/lib/srp';

import { useVerifyOwnershipWithPhraseActorRef } from '../../UnauthedLost2FAContainer';
import { useUnauthedLost2FATelemetry } from '../../useUnauthedLost2FATelemetry';

interface Props {
    username: string;
}

const VerifyOwnershipWithPhraseStepContent = ({
    actorRef,
    username,
}: {
    actorRef: NonNullable<ReturnType<typeof useVerifyOwnershipWithPhraseActorRef>>;
    username: string;
}) => {
    const { send } = actorRef;

    const verifyPhrase = useSelector(actorRef, (s) => s.matches('verify phrase'));

    const { sendStepLoad } = useUnauthedLost2FATelemetry();
    useEffect(() => {
        if (!verifyPhrase) {
            return;
        }

        sendStepLoad('verify ownership with phrase');
    }, [verifyPhrase]);

    const api = useApi();
    const handleError = useErrorHandler();
    const { validator, onFormSubmit } = useFormErrors();

    const [phrase, setPhrase] = useState('');
    const phraseValidation = useMnemonicInputValidation(phrase);
    const [submitting, withSubmitting] = useLoading();

    const handleSubmit = async () => {
        if (!onFormSubmit()) {
            return;
        }

        try {
            const randomBytes = await mnemonicToBase64RandomBytes(phrase);
            const info = await api<InfoResponse>(getMnemonicAuthInfo(username));
            await srpAuth({
                info,
                api,
                config: reauthMnemonic({ Username: username, PersistentCookies: false }),
                credentials: { username, password: randomBytes },
            });
            await api(disable2FA());
            send({ type: '2fa disabled' });
        } catch (error) {
            handleError(error);
            send({ type: 'error' });
        }
    };

    return (
        <Form onSubmit={() => withSubmitting(handleSubmit())}>
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
            <Button size="large" fullWidth onClick={() => send({ type: 'try another way' })}>
                {c('Action').t`Verify another way`}
            </Button>
        </Form>
    );
};

export const VerifyOwnershipWithPhraseStep = ({ username }: Props) => {
    const actorRef = useVerifyOwnershipWithPhraseActorRef();

    if (!actorRef) {
        return null;
    }

    return <VerifyOwnershipWithPhraseStepContent actorRef={actorRef} username={username} />;
};
