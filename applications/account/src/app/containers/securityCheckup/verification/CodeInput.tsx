import { type ReactNode, useEffect, useState } from 'react';

import { c } from 'ttag';

import { useCodeInput } from '@proton/account/safetyReview/verification/useCodeInput';
import type { VerificationMethod } from '@proton/account/safetyReview/verification/verification';
import { Button } from '@proton/atoms/Button/Button';
import { Form, InputFieldTwo, TotpInput, useFormErrors } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { numberValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import noop from '@proton/utils/noop';

interface Props {
    value: ReactNode;
    onSuccess: () => void;
    onError: () => void;
    method: VerificationMethod;
}

export const CodeInput = ({ value, onSuccess, onError, method }: Props) => {
    const { actions, state } = useCodeInput();

    useEffect(() => {
        actions.handleInitiateVerification(method).catch(onError);
    }, []);

    const { validator, onFormSubmit, reset } = useFormErrors();

    const [submittingCode, withSubmittingCode] = useLoading();
    const [resendingCode, withResendingCode] = useLoading();

    const [code, setCode] = useState<string>('');

    return (
        <Form
            onSubmit={() => {
                if (!onFormSubmit()) {
                    return;
                }
                withSubmittingCode(actions.handleSubmit(code, method).then(onSuccess).catch(noop));
            }}
        >
            <InputFieldTwo
                as={TotpInput}
                autoFocus
                length={6}
                value={code}
                onValue={(value: string) => {
                    setCode(value);
                    actions.resetCodeError();
                }}
                error={validator([
                    requiredValidator(code),
                    numberValidator(code),
                    code.length !== 6 ? c('Error').t`Enter 6 digits` : '',
                    state.codeError,
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
            {state.showResendCode && state.token ? (
                <Button
                    shape="ghost"
                    color="norm"
                    fullWidth
                    loading={resendingCode}
                    disabled={submittingCode}
                    onClick={async () => {
                        if (state.token) {
                            await withResendingCode(actions.handleSendNewCode(value, state.token, method));
                            reset();
                        }
                    }}
                    className="mt-2"
                >
                    {c('Safety review').t`Send a new code`}
                </Button>
            ) : null}
        </Form>
    );
};
