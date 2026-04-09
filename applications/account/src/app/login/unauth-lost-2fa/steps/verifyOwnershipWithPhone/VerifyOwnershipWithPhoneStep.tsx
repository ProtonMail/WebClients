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
import { reauthBySmsVerification } from '@proton/shared/lib/api/verify';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { numberValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import { initiateVerification, verifyCode } from '../../../../containers/securityCheckup/verification/verification';
import { getSMSVerificationCodeText } from '../../../../content/helper';
import { useVerifyOwnershipWithPhoneActorRef } from '../../UnauthedLost2FAContainer';

type VerificationResult = Awaited<ReturnType<typeof initiateVerification>>;

const VerifyCodeStep = ({ verificationResult }: { verificationResult: VerificationResult }) => {
    const { token, verificationDataResult } = verificationResult;

    const actorRef = useVerifyOwnershipWithPhoneActorRef();
    const { send } = actorRef;

    const api = useApi();

    const [code, setCode] = useState('');
    const [codeError, setCodeError] = useState('');
    const [submittingCode, withSubmittingCode] = useLoading();

    const handleError = useErrorHandler();

    const { validator, onFormSubmit } = useFormErrors();

    const recoveryPhoneElement = <b key="recovery-phone">{verificationDataResult.ChallengeDestination}</b>;

    const invalidCodeError = c('Safety review').t`Invalid code`;

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
                setCodeError(invalidCodeError);
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
                {c('Info').t`To help keep your account safe, we want to make sure it's really you trying to sign in.`}
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
                    setCodeError('');
                }}
                error={validator([
                    requiredValidator(code),
                    numberValidator(code),
                    code.length !== 6 ? c('Error').t`Enter 6 digits` : '',
                    codeError,
                ])}
            />
            <Button size="large" color="danger" type="submit" fullWidth loading={submittingCode} className="mb-2 mt-4">
                {c('Action').t`Disable`}
            </Button>
            <Button size="large" fullWidth onClick={() => send({ type: 'try another way' })}>
                {c('Action').t`Verify another way`}
            </Button>
        </Form>
    );
};

export const VerifyOwnershipWithPhoneStep = () => {
    const actorRef = useVerifyOwnershipWithPhoneActorRef();
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
                    method: 'phone',
                    config: reauthBySmsVerification(),
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
