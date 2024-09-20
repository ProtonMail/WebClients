import type { KeyboardEvent, ReactNode } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { useLoading } from '@proton/hooks';
import { numberValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { isNumber } from '@proton/shared/lib/helpers/validators';
import noop from '@proton/utils/noop';

import Text from './Text';
import { getFormattedCode } from './helper';
import type { VerificationModel } from './interface';

interface Props {
    onSubmit: (code: string, verificationModel: VerificationModel) => void;
    onNoReceive: () => void;
    verification: VerificationModel;
    description?: ReactNode;
    footer?: ReactNode;
}

const VerifyCodeForm = ({ onSubmit, onNoReceive, verification, description, footer }: Props) => {
    const [code, setCode] = useState('');
    const [loading, withLoading] = useLoading();

    const { validator, onFormSubmit } = useFormErrors();

    const handleSubmit = async () => {
        if (loading || !onFormSubmit()) {
            return;
        }
        const formattedCode = getFormattedCode(verification, code);
        return onSubmit(formattedCode, verification);
    };

    const destinationText = <strong key="destination">{verification.value}</strong>;

    return (
        <>
            {description || (
                <Text>
                    {c('Info').jt`Enter the verification code that was sent to ${destinationText}.`}{' '}
                    {verification.method === 'email'
                        ? c('Info').t`If you don't find the email in your inbox, please check your spam folder.`
                        : null}
                </Text>
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
                className="mt-6"
            >
                {(() => {
                    if (verification.method === 'ownership-email') {
                        if (verification.type === 'login') {
                            return c('Action').t`Verify account`;
                        }
                        if (verification.type === 'external') {
                            return c('Action').t`Verify`;
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
                className="mt-2"
            >{c('Action').t`Resend code`}</Button>
            {footer}
        </>
    );
};

export default VerifyCodeForm;
