import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { useSelector } from '@xstate/react';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Form, InputFieldTwo, TotpInput, useApi, useErrorHandler, useFormErrors } from '@proton/components/index';
import useLoading from '@proton/hooks/useLoading';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { disable2FA } from '@proton/shared/lib/api/settings';
import { reauthBySmsVerification } from '@proton/shared/lib/api/verify';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { numberValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import {
    initiateVerification,
    sendNewCode,
    verifyCode,
} from '../../../../containers/securityCheckup/verification/verification';
import { getSMSVerificationCodeText } from '../../../../content/helper';
import { useRequestNewVerificationCode } from '../../../../unauthed-forgot-password/hooks/useRequestNewVerificationCode';
import { useVerifyOwnershipWithPhoneActorRef } from '../../UnauthedLost2FAContainer';
import { useUnauthedLost2FATelemetry } from '../../useUnauthedLost2FATelemetry';

type VerificationResult = Awaited<ReturnType<typeof initiateVerification>>;

const VerifyCodeStep = ({ verificationResult }: { verificationResult: VerificationResult }) => {
    const { token, verificationDataResult } = verificationResult;

    const actorRef = useVerifyOwnershipWithPhoneActorRef();
    const { send } = actorRef;

    const api = useApi();

    const [code, setCode] = useState('');
    const [hasInvalidCodeError, setHasInvalidCodeError] = useState<ReactNode | null>(null);
    const [submittingCode, withSubmittingCode] = useLoading();

    const handleError = useErrorHandler();

    const { validator, onFormSubmit } = useFormErrors();

    const recoveryPhoneElement = <b key="recovery-phone">{verificationDataResult.ChallengeDestination}</b>;

    const handleResend = () => {
        setCode('');
        setHasInvalidCodeError(null);
        return sendNewCode({ api, method: 'phone', token });
    };

    const { RequestNewCodeModal, InvalidCodeErrorMessage, AssistiveText } = useRequestNewVerificationCode({
        recoveryMethod: 'phone',
        value: verificationDataResult.ChallengeDestination,
        onResend: handleResend,
    });

    const handleSubmitCode = async (code: string) => {
        try {
            await verifyCode({
                token,
                code,
                api,
                method: 'phone',
                config: reauthBySmsVerification(),
            });

            await api(disable2FA());

            send({ type: '2fa disabled' });
        } catch (error: any) {
            const { code } = getApiError(error);

            if (code === API_CUSTOM_ERROR_CODES.TOKEN_INVALID) {
                setHasInvalidCodeError(InvalidCodeErrorMessage);
                return;
            }

            handleError(error);
        }
    };

    const handleSubmit = async () => {
        if (!onFormSubmit()) {
            return;
        }
        return handleSubmitCode(code);
    };

    return (
        <Form onSubmit={() => withSubmittingCode(handleSubmit())}>
            <div className="mb-4">
                {c('Info').t`To help keep your account safe, we want to make sure it’s really you trying to sign in.`}
            </div>
            <div className="mb-4">{getSMSVerificationCodeText(recoveryPhoneElement)}</div>
            <InputFieldTwo
                label={
                    // translator: 'code' here refers to a 6 digit code sent to the users recovery phone via SMS
                    c('Action').t`Enter code`
                }
                as={TotpInput}
                autoFocus
                length={6}
                value={code}
                onValue={(value: string) => {
                    setCode(value);
                    setHasInvalidCodeError('');
                }}
                error={
                    validator([
                        requiredValidator(code),
                        numberValidator(code),
                        code.length !== 6 ? c('Error').t`Enter 6 digits` : '',
                    ]) || hasInvalidCodeError
                }
                assistiveText={AssistiveText}
            />
            <Button size="large" color="danger" type="submit" fullWidth loading={submittingCode} className="mb-2 mt-4">
                {c('Action').t`Disable`}
            </Button>
            <Button size="large" fullWidth onClick={() => send({ type: 'try another way' })}>
                {c('Action').t`Verify another way`}
            </Button>
            {RequestNewCodeModal}
        </Form>
    );
};

const VerifyOwnershipWithPhoneStepContent = ({
    actorRef,
}: {
    actorRef: NonNullable<ReturnType<typeof useVerifyOwnershipWithPhoneActorRef>>;
}) => {
    const { send } = actorRef;

    const api = useApi();

    const [loading, withLoading] = useLoading();
    const errorHandler = useErrorHandler();

    const verifyCodeStep = useSelector(actorRef, (s) => s.matches('verify code'));
    const verificationResult = useSelector(actorRef, (s) => s.context.verificationResult);

    const { sendStepLoad } = useUnauthedLost2FATelemetry();
    useEffect(() => {
        if (!verifyCodeStep) {
            return;
        }

        sendStepLoad('verify ownership with phone');
    }, [verifyCodeStep]);

    if (!verificationResult) {
        const sendCode = async () => {
            try {
                const result = await initiateVerification({
                    api,
                    method: 'phone',
                    config: reauthBySmsVerification(),
                });

                send({ type: 'verification initiated', verificationResult: result });
            } catch (error) {
                errorHandler(error);
            }
        };

        return (
            <>
                <p>
                    {c('Info')
                        .t`To help keep your account safe, we want to make sure it’s really you trying to sign in.`}
                </p>

                <p>{c('Info')
                    .jt`${BRAND_NAME} will send a verification code to your recovery phone. Standard message rates may apply.`}</p>

                <Button
                    size="large"
                    color="norm"
                    type="submit"
                    fullWidth
                    onClick={() => withLoading(sendCode)}
                    loading={loading}
                    className="mt-6"
                >
                    {c('Action').t`Send code`}
                </Button>

                <Button size="large" fullWidth className="mt-2" onClick={() => send({ type: 'try another way' })}>
                    {c('Action').t`Try another way`}
                </Button>
            </>
        );
    }

    if (verifyCodeStep && verificationResult) {
        return <VerifyCodeStep verificationResult={verificationResult} />;
    }

    return null;
};

export const VerifyOwnershipWithPhoneStep = () => {
    const actorRef = useVerifyOwnershipWithPhoneActorRef();

    if (!actorRef) {
        return null;
    }

    return <VerifyOwnershipWithPhoneStepContent actorRef={actorRef} />;
};
