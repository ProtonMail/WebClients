import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { InputFieldTwo } from '@proton/components';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import useLoading from '@proton/hooks/useLoading';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import Content from '../../../public/Content';
import Header from '../../../public/Header';
import Text from '../../../public/Text';
import { useResetPasswordTelemetry } from '../../../reset/resetPasswordTelemetry';
import { NoResetMethodsError, handleRequestRecoveryMethods } from '../../actions';
import { useAutomaticMnemonicVerification } from '../../hooks/useAutomaticMnemonicVerification';
import { useAutomaticRecoveryVerification } from '../../hooks/useAutomaticRecoveryVerification';
import type { UnauthedForgotPasswordStateMachine } from '../../state-machine/UnauthedForgotPasswordStateMachine';
import { useForgotPasswordProps } from '../../wizard/ForgotPasswordProvider';
import { useMachineWizard } from '../../wizard/MachineWizardProvider';

export const EntryStep = () => {
    const { sendResetPasswordRecoveryMethodsRequested, sendResetPasswordStepLoad } = useResetPasswordTelemetry({
        variant: 'B',
    });
    const { onPreSubmit, onStartAuth } = useForgotPasswordProps();
    const { send } = useMachineWizard<typeof UnauthedForgotPasswordStateMachine>();
    const [loading, withLoading] = useLoading();
    const silentApi = useSilentApi();
    const errorHandler = useErrorHandler();

    const { validator, onFormSubmit } = useFormErrors();
    const [username, setUsername] = useState('');
    const { loading: automationMnemonicVerificationLoading } = useAutomaticMnemonicVerification({
        onPreSubmit,
        onStartAuth,
    });
    const automaticVerification = useAutomaticRecoveryVerification({
        onPreSubmit,
        onStartAuth,
        onSuccess: (username: string) => {
            setUsername(username);
        },
    });

    useEffect(() => {
        sendResetPasswordStepLoad({
            step: 'entry',
        });
    }, []);

    const handleSubmit = async () => {
        try {
            await onPreSubmit();
            await onStartAuth();
            const result = await handleRequestRecoveryMethods({
                username,
                api: silentApi,
            });
            sendResetPasswordRecoveryMethodsRequested({
                hasPasswordResetMethod:
                    result.methods.includes('email') ||
                    result.methods.includes('sms') ||
                    result.methods.includes('login'),
                hasDataRecoveryMethod: result.methods.includes('mnemonic'),
            });
            send({
                type: 'recovery.started',
                payload: result,
            });
        } catch (error) {
            if (error instanceof NoResetMethodsError) {
                sendResetPasswordRecoveryMethodsRequested({
                    hasPasswordResetMethod: false,
                    hasDataRecoveryMethod: false,
                });
                send({
                    type: 'recovery.started',
                    payload: {
                        accountType: '',
                        methods: [],
                        username,
                        redactedEmail: '',
                        redactedPhoneNumber: '',
                    },
                });
            } else {
                errorHandler(error);
            }
        }
    };

    const handleBackStep = () => send({ type: 'decision.back' });

    const showLoading = loading || automaticVerification.loading || automationMnemonicVerificationLoading;
    return (
        <>
            <Header title={c('Title').t`Recover account`} onBack={handleBackStep} />
            <Content>
                <Text>{c('Info').t`Enter your ${BRAND_NAME} Account email address or username.`}</Text>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (loading || !onFormSubmit()) {
                            return;
                        }
                        void withLoading(handleSubmit());
                    }}
                >
                    <InputFieldTwo
                        id="username"
                        bigger
                        label={c('Label').t`Email or username`}
                        error={validator([requiredValidator(username)])}
                        disableChange={showLoading}
                        value={username}
                        onValue={setUsername}
                        autoFocus
                    />
                    <Button size="large" color="norm" loading={showLoading} type="submit" fullWidth className="mt-6">
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
