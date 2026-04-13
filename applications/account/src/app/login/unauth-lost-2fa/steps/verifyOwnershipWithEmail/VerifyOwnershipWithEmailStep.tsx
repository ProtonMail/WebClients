import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { useSelector } from '@xstate/react';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import {
    Form,
    InputFieldTwo,
    Loader,
    TotpInput,
    useApi,
    useErrorHandler,
    useFormErrors,
} from '@proton/components/index';
import useLoading from '@proton/hooks/useLoading';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { disable2FA } from '@proton/shared/lib/api/settings';
import { reauthByEmailVerification } from '@proton/shared/lib/api/verify';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { numberValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import {
    initiateVerification,
    sendNewCode,
    verifyCode,
} from '../../../../containers/securityCheckup/verification/verification';
import { getEmailVerificationCodeText } from '../../../../content/helper';
import { useRequestNewVerificationCode } from '../../../../unauthed-forgot-password/hooks/useRequestNewVerificationCode';
import { useVerifyOwnershipWithEmailActorRef } from '../../UnauthedLost2FAContainer';

type VerificationResult = Awaited<ReturnType<typeof initiateVerification>>;

const VerifyCodeStep = ({ verificationResult }: { verificationResult: VerificationResult }) => {
    const { token, verificationDataResult } = verificationResult;

    const actorRef = useVerifyOwnershipWithEmailActorRef();
    const { send } = actorRef;

    const api = useApi();

    const [code, setCode] = useState('');
    const [hasInvalidCodeError, setHasInvalidCodeError] = useState<ReactNode | null>(null);
    const [submittingCode, withSubmittingCode] = useLoading();

    const handleError = useErrorHandler();

    const { validator, onFormSubmit } = useFormErrors();

    const recoveryEmailElement = <b key="recovery-email">{verificationDataResult.ChallengeDestination}</b>;

    const handleResend = () => {
        setCode('');
        setHasInvalidCodeError(null);
        return sendNewCode({ api, method: 'email', token });
    };

    const { RequestNewCodeModal, InvalidCodeErrorMessage, AssistiveText } = useRequestNewVerificationCode({
        recoveryMethod: 'email',
        value: verificationDataResult.ChallengeDestination,
        onResend: handleResend,
    });

    const handleSubmitCode = async (code: string) => {
        try {
            await verifyCode({
                token,
                code,
                api,
                method: 'email',
                config: reauthByEmailVerification(),
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
            <div className="mb-4">{getEmailVerificationCodeText(recoveryEmailElement)}</div>
            <InputFieldTwo
                label={
                    // translator: 'code' here refers to a 6 digit code sent to the users recovery email inbox
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

export const VerifyOwnershipWithEmailStep = () => {
    const actorRef = useVerifyOwnershipWithEmailActorRef();
    const { send } = actorRef;

    const validating = useSelector(actorRef, (s) => s.matches('validating'));
    const verifyCodeStep = useSelector(actorRef, (s) => s.matches('verify code'));

    const handleError = useErrorHandler();

    const api = useApi();

    const [verificationResult, setVerificationResult] = useState<VerificationResult>();

    useEffect(() => {
        if (actorRef.getSnapshot().value !== 'verify code') {
            return;
        }

        const sendCode = async () => {
            try {
                const result = await initiateVerification({
                    api,
                    method: 'email',
                    config: reauthByEmailVerification(),
                });

                setVerificationResult(result);
            } catch (error) {
                handleError(error);
                send({ type: 'error' });
            }
        };
        void sendCode();
    }, [actorRef.getSnapshot().value]);

    if (validating || !verificationResult) {
        return <Loader />;
    }

    if (verifyCodeStep) {
        return <VerifyCodeStep verificationResult={verificationResult} />;
    }

    return null;
};
