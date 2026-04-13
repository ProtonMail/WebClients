import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import { InputFieldTwo } from '@proton/components/index';
import useLoading from '@proton/hooks/useLoading';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import type { ValidateResetTokenResponse } from '@proton/shared/lib/api/reset';
import { validateResetToken } from '@proton/shared/lib/api/reset';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import noop from '@proton/utils/noop';

import { UserNameWithIcon } from '../../../components/username/UserNameWithIcon';
import { getEmailVerificationCodeText } from '../../../content/helper';
import Content from '../../../public/Content';
import Header from '../../../public/Header';
import { useResetPasswordTelemetry } from '../../../reset/resetPasswordTelemetry';
import { getDeviceRecoveryLevel } from '../../actions';
import { useRequestCode } from '../../hooks/useRequestCode';
import { useRequestNewVerificationCode } from '../../hooks/useRequestNewVerificationCode';
import type { UnauthedForgotPasswordStateMachine } from '../../state-machine/UnauthedForgotPasswordStateMachine';
import { useMachineWizard } from '../../wizard/MachineWizardProvider';

export const VerifyEmailRecoveryCode = () => {
    const { send, snapshot } = useMachineWizard<typeof UnauthedForgotPasswordStateMachine>();
    const { username, redactedRecoveryEmail } = snapshot.context;
    const { sendResetPasswordCodeSent, sendResetPasswordMethodValidated, sendResetPasswordStepLoad } =
        useResetPasswordTelemetry({ variant: 'B' });

    const silentApi = useSilentApi();
    const [loading, withLoading] = useLoading();
    const { validator, onFormSubmit } = useFormErrors();
    const errorHandler = useErrorHandler();
    const [hasInvalidCodeError, setHasInvalidCodeError] = useState<ReactNode | null>(null);
    const [code, setCode] = useState('');

    const RedactedEmail = <strong key="redacted-recovery-email">{redactedRecoveryEmail}</strong>;

    const requestCode = useRequestCode({
        method: 'email',
        username,
        onSuccess: noop,
        onError: errorHandler,
    });

    useEffect(() => {
        sendResetPasswordStepLoad({
            step: 'verifyRecoveryEmail',
        });

        void withLoading(
            requestCode().then(() => sendResetPasswordCodeSent({ step: 'verifyRecoveryEmail', method: 'email' }))
        );
    }, []);

    const handleResend = () => {
        setCode('');
        setHasInvalidCodeError(null);
        return withLoading(
            requestCode().then(() => sendResetPasswordCodeSent({ step: 'verifyRecoveryEmail', method: 'email' }))
        );
    };

    const { RequestNewCodeModal, InvalidCodeErrorMessage, AssistiveText } = useRequestNewVerificationCode({
        recoveryMethod: 'email',
        value: redactedRecoveryEmail ?? '',
        onResend: handleResend,
    });

    const handleSubmit = async () => {
        try {
            const resetResponse = await silentApi<ValidateResetTokenResponse>(validateResetToken(username, code));
            const deviceRecoveryLevel = await getDeviceRecoveryLevel(resetResponse);

            sendResetPasswordMethodValidated({ step: 'verifyRecoveryEmail', method: 'email' });
            send({
                type: 'email.code.validated',
                payload: {
                    ownershipVerificationCode: code,
                    resetResponse,
                    deviceRecoveryLevel,
                },
            });
        } catch (error) {
            const apiError = getApiError(error);
            if (apiError.code === API_CUSTOM_ERROR_CODES.INVALID_VALUE) {
                setHasInvalidCodeError(InvalidCodeErrorMessage);
            } else {
                errorHandler(error);
            }
        }
    };

    return (
        <>
            <Header
                title={c('Title').t`Verify it’s you`}
                subTitle={<UserNameWithIcon username={username} />}
                onBack={() => send({ type: 'decision.back' })}
            />
            <Content>
                <p>
                    {c('Info')
                        .t`To help keep your account safe, we want to make sure it’s really you trying to sign in.`}
                </p>

                <p>{getEmailVerificationCodeText(RedactedEmail)}</p>
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
                        id="reset-token"
                        bigger
                        label={c('Label').t`Enter code`}
                        error={validator([requiredValidator(code)]) || hasInvalidCodeError}
                        disableChange={loading}
                        value={code}
                        onValue={(value: string) => {
                            setCode(value);
                            setHasInvalidCodeError(null);
                        }}
                        autoFocus
                        assistiveText={AssistiveText}
                    />
                    <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt-6">
                        {c('Action').t`Verify`}
                    </Button>

                    <Button size="large" fullWidth className="mt-2" onClick={() => send({ type: 'decision.skip' })}>
                        {c('Action').t`Try another way`}
                    </Button>
                </form>
            </Content>
            {RequestNewCodeModal}
        </>
    );
};
