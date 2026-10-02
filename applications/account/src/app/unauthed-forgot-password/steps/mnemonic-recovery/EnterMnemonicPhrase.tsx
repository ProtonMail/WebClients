import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import MnemonicInputField, {
    useMnemonicInputValidation,
} from '@proton/components/containers/mnemonic/MnemonicInputField';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import isTruthy from '@proton/utils/isTruthy';

import { UserNameWithIcon } from '../../../components/username/UserNameWithIcon';
import Content from '../../../public/Content';
import Header from '../../../public/Header';
import { useResetPasswordTelemetry } from '../../../reset/resetPasswordTelemetry';
import {
    selectResetResponse,
    selectSubmitting,
    selectUsername,
} from '../../state-machine/UnauthedForgotPasswordStateMachine';
import { ForgotPasswordContext } from '../../wizard/ForgotPasswordContext';
import type { ForgotPasswordStepProps } from '../../wizard/forgotPasswordStep';

export const EnterMnemonicPhrase = ({ onBack }: ForgotPasswordStepProps) => {
    const { send } = ForgotPasswordContext.useActorRef();
    const username = ForgotPasswordContext.useSelector(selectUsername);
    const resetResponse = ForgotPasswordContext.useSelector(selectResetResponse);

    const [mnemonic, setMnemonic] = useState('');
    const mnemonicValidation = useMnemonicInputValidation(mnemonic);
    const { validator, onFormSubmit } = useFormErrors();

    // The machine checks the phrase
    const loading = ForgotPasswordContext.useSelector(selectSubmitting);
    const hasInvalidMnemonic = mnemonic && mnemonicValidation.filter(isTruthy);

    const { sendResetPasswordStepLoad } = useResetPasswordTelemetry({ variant: 'B' });
    useEffect(() => {
        sendResetPasswordStepLoad({
            step: 'mnemonicRecoveryEnterPhrase',
        });
    }, []);

    return (
        <>
            <Header
                title={resetResponse ? c('Title').t`Reset password?` : c('Title').t`Verify it’s you`}
                subTitle={<UserNameWithIcon username={username} />}
                onBack={onBack}
            />
            <Content>
                {resetResponse ? (
                    <p>
                        {c('Info')
                            .t`To regain access to your account and data, enter the 12-word recovery phrase associated with your account.`}
                    </p>
                ) : (
                    <>
                        <p>
                            {c('Info')
                                .t`To help keep your account safe, we want to make sure it’s really you trying to sign in.`}
                        </p>

                        <p>{c('Info').t`Enter the 12-word recovery phrase associated with your account.`}</p>
                    </>
                )}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (loading || !onFormSubmit()) {
                            return;
                        }
                        send({ type: 'phrase.submitted', payload: { mnemonic } });
                    }}
                >
                    <MnemonicInputField
                        disableChange={loading}
                        value={mnemonic}
                        onValue={setMnemonic}
                        autoFocus
                        error={validator([requiredValidator(mnemonic), ...mnemonicValidation])}
                    />

                    <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt-6">
                        {c('Action').t`Reset password`}
                    </Button>

                    <Button size="large" fullWidth className="mt-2" onClick={() => send({ type: 'decision.skip' })}>
                        {hasInvalidMnemonic.length > 0
                            ? c('Action').t`Try another way`
                            : c('Action').t`I don't have my phrase`}
                    </Button>
                </form>
            </Content>
        </>
    );
};
