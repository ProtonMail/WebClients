import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { InputField as InputFieldTwo } from '@proton/components/components/v2/field/InputField';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import Content from '../../../public/Content';
import Header from '../../../public/Header';
import Text from '../../../public/Text';
import { useResetPasswordTelemetry } from '../../../reset/resetPasswordTelemetry';
import { useAutomaticMnemonicVerification } from '../../hooks/useAutomaticMnemonicVerification';
import { useAutomaticRecoveryVerification } from '../../hooks/useAutomaticRecoveryVerification';
import { selectSubmitting } from '../../state-machine/UnauthedForgotPasswordStateMachine';
import { ForgotPasswordContext } from '../../wizard/ForgotPasswordContext';
import type { ForgotPasswordStepProps } from '../../wizard/forgotPasswordStep';

export const EntryStep = ({ onBack }: ForgotPasswordStepProps) => {
    const { sendResetPasswordStepLoad } = useResetPasswordTelemetry({ variant: 'B' });
    const { send } = ForgotPasswordContext.useActorRef();
    // The recovery methods are being requested, or a link that opened the page is being checked
    const loading = ForgotPasswordContext.useSelector(selectSubmitting);

    const { validator, onFormSubmit } = useFormErrors();
    const [username, setUsername] = useState('');
    useAutomaticMnemonicVerification();
    useAutomaticRecoveryVerification({ onUsername: setUsername });

    useEffect(() => {
        sendResetPasswordStepLoad({
            step: 'entry',
        });
    }, []);

    const handleBackStep = () => send({ type: 'decision.back' });

    return (
        <>
            <Header title={c('Title').t`Recover account`} onBack={onBack} />
            <Content>
                <Text>{c('Info').t`Enter your ${BRAND_NAME} Account email address or username.`}</Text>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (loading || !onFormSubmit()) {
                            return;
                        }
                        send({ type: 'username.submitted', payload: { username } });
                    }}
                >
                    <InputFieldTwo
                        id="username"
                        bigger
                        label={c('Label').t`Email or username`}
                        error={validator([requiredValidator(username)])}
                        disableChange={loading}
                        value={username}
                        onValue={setUsername}
                        autoFocus
                    />
                    <Button size="large" color="norm" loading={loading} type="submit" fullWidth className="mt-6">
                        {c('Action').t`Next`}
                    </Button>
                    <Button size="large" shape="ghost" color="norm" fullWidth className="mt-2" onClick={handleBackStep}>
                        {c('Action').t`Return to sign-in`}
                    </Button>
                </form>
            </Content>
        </>
    );
};
