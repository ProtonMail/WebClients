import { c } from 'ttag';
import React, { useState } from 'react';
import { noop } from 'proton-shared/lib/helpers/function';
import { isNumber } from 'proton-shared/lib/helpers/validators';
import { numberValidator, requiredValidator } from 'proton-shared/lib/helpers/formValidators';
import { Button, useFormErrors, InputFieldTwo } from '../../../components';
import { useLoading } from '../../../hooks';
import { VerificationModel } from './interface';
import { getFormattedCode } from './helper';

interface Props {
    onSubmit: (token: string, tokenType: 'email' | 'sms') => void;
    onNoReceive: () => void;
    verification: VerificationModel;
}

const VerifyCodeForm = ({ onSubmit, onNoReceive, verification }: Props) => {
    const [code, setCode] = useState('');
    const [loading, withLoading] = useLoading();

    const { validator, onFormSubmit } = useFormErrors();

    const handleSubmit = async () => {
        if (loading || !onFormSubmit()) {
            return;
        }
        const token = getFormattedCode(verification.value, code);
        return onSubmit(token, verification.method);
    };

    const destinationText = <strong key="destination">{verification.value}</strong>;

    return (
        <>
            <div className="mb2">
                {c('Info').jt`Enter the verification code that was sent to ${destinationText}.`}{' '}
                {verification.method === 'email'
                    ? c('Info').t`If you don't find the email in your inbox, please check your spam folder.`
                    : null}
            </div>
            <InputFieldTwo
                id="verification"
                bigger
                label={c('Label').t`Verification code`}
                error={validator([
                    requiredValidator(code),
                    numberValidator(code),
                    code.length !== 6 ? c('Error').t`Enter 6 digits` : '',
                ])}
                assistiveText={c('Label').t`Enter the 6-digit code`}
                disableChange={loading}
                inputMode="numeric"
                autoFocus
                value={code}
                onValue={(value: string) => {
                    if (!value || isNumber(value)) {
                        setCode(value);
                    }
                }}
                maxLength={6}
                placeholder="123456"
                onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        withLoading(handleSubmit()).catch(noop);
                    }
                }}
            />
            <Button
                size="large"
                color="norm"
                type="button"
                fullWidth
                loading={loading}
                onClick={() => {
                    withLoading(handleSubmit()).catch(noop);
                }}
                className="mt1-75"
            >{c('Action').t`Verify`}</Button>
            <Button
                size="large"
                color="norm"
                type="button"
                shape="ghost"
                fullWidth
                disabled={loading}
                onClick={() => {
                    onNoReceive();
                }}
                className="mt0-5"
            >{c('Action').t`Did not receive the code?`}</Button>
        </>
    );
};

export default VerifyCodeForm;
