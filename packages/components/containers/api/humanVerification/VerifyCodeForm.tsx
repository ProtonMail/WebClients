import { KeyboardEvent, ReactNode, useState } from 'react';
import { c } from 'ttag';
import { noop } from '@proton/shared/lib/helpers/function';
import { isNumber } from '@proton/shared/lib/helpers/validators';
import { numberValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import { Button, useFormErrors, InputFieldTwo } from '../../../components';
import { useLoading } from '../../../hooks';
import { VerificationModel } from './interface';
import { getFormattedCode } from './helper';

interface Props {
    onSubmit: (code: string, tokenType: 'email' | 'sms' | 'ownership-email' | 'ownership-sms') => void;
    onNoReceive: () => void;
    verification: VerificationModel;
    description?: ReactNode;
}

const VerifyCodeForm = ({ onSubmit, onNoReceive, verification, description }: Props) => {
    const [code, setCode] = useState('');
    const [loading, withLoading] = useLoading();

    const { validator, onFormSubmit } = useFormErrors();

    const handleSubmit = async () => {
        if (loading || !onFormSubmit()) {
            return;
        }
        const formattedCode = getFormattedCode(verification, code);
        return onSubmit(formattedCode, verification.method);
    };

    const destinationText = <strong key="destination">{verification.value}</strong>;

    return (
        <>
            {description || (
                <div className="mb2 text-break">
                    {c('Info').jt`Enter the verification code that was sent to ${destinationText}.`}{' '}
                    {verification.method === 'email'
                        ? c('Info').t`If you don't find the email in your inbox, please check your spam folder.`
                        : null}
                </div>
            )}
            <InputFieldTwo
                id="verification"
                bigger
                label={c('Label').t`Verification code`}
                error={validator([
                    requiredValidator(code),
                    numberValidator(code),
                    code.length !== 6 ? c('Error').t`Enter 6 digits` : '',
                ])}
                assistiveText={c('Label').t`Code is 6 digits without spaces`}
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
                onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
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
            >
                {(() => {
                    if (verification.method === 'ownership-email') {
                        if (verification.type === 'login') {
                            return c('Action').t`Verify account`;
                        }
                        if (verification.type === 'external') {
                            return c('Action').t`Verify email`;
                        }
                    }
                    if (verification.method === 'ownership-sms') {
                        if (verification.type === 'login') {
                            return c('Action').t`Verify account`;
                        }
                    }
                    return c('Action').t`Verify`;
                })()}
            </Button>
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
            >{c('Action').t`Didn't receive the code?`}</Button>
        </>
    );
};

export default VerifyCodeForm;
