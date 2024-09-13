import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Form,
    InputFieldTwo,
    TotpInput,
    useApi,
    useEventManager,
    useFormErrors,
    useNotifications,
} from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { numberValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import type { VerificationMethod } from './verification';
import { initiateVerification, sendNewCode, verifyCode } from './verification';

interface Props {
    value: string;
    onSuccess: () => void;
    onError: () => void;
    method: VerificationMethod;
}

export const CodeInput = ({ value, onSuccess, onError, method }: Props) => {
    const api = useApi();

    const { createNotification } = useNotifications();
    const { call } = useEventManager();

    const [token, setToken] = useState();

    const [code, setCode] = useState('');
    const [codeError, setCodeError] = useState('');
    const [submittingCode, withSubmittingCode] = useLoading();
    const [resendingCode, withResendingCode] = useLoading();

    const [showResendCode, setShowResendCode] = useState(false);

    const { validator, onFormSubmit, reset } = useFormErrors();

    const invalidCodeError = c('Safety review').t`Invalid code`;

    useEffect(() => {
        void initiateVerification({ api, method })
            .then((token) => setToken(token))
            .catch(() => onError());
    }, []);

    const handleSubmitCode = async (code: string) => {
        if (!token) {
            setCodeError(invalidCodeError);
            setShowResendCode(true);
            return;
        }

        try {
            await verifyCode({
                token,
                code,
                api,
                method,
                call,
            });

            onSuccess();
        } catch (error: any) {
            const { code } = getApiError(error);

            if (code === API_CUSTOM_ERROR_CODES.TOKEN_INVALID) {
                setCodeError(invalidCodeError);
                setShowResendCode(true);
            }
        }
    };

    const handleSubmit = async () => {
        if (!onFormSubmit()) {
            return;
        }
        return handleSubmitCode(code);
    };

    const boldValue = <b key="bold-value">{value}</b>;

    const handleSendNewCode = async (token: string) => {
        await sendNewCode({ token, api, method });

        setCode('');
        setCodeError('');
        reset();

        createNotification({ text: c('Safety review').jt`Code sent to ${boldValue}` });
    };

    return (
        <Form onSubmit={() => withSubmittingCode(handleSubmit())}>
            <InputFieldTwo
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
            <Button
                color="norm"
                type="submit"
                fullWidth
                loading={submittingCode}
                disabled={resendingCode}
                className="mt-8"
            >
                {c('Safety review').t`Verify`}
            </Button>
            {showResendCode && token ? (
                <Button
                    shape="ghost"
                    color="norm"
                    fullWidth
                    loading={resendingCode}
                    disabled={submittingCode}
                    onClick={() => withResendingCode(handleSendNewCode(token))}
                    className="mt-2"
                >
                    {c('Safety review').t`Send a new code`}
                </Button>
            ) : null}
        </Form>
    );
};
