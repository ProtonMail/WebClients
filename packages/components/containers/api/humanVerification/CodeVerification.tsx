import React, { useState, useRef, useEffect } from 'react';
import { queryVerificationCode } from 'proton-shared/lib/api/user';
import { isNumber } from 'proton-shared/lib/helpers/validators';
import { validateEmailAddress } from 'proton-shared/lib/helpers/email';
import { API_CUSTOM_ERROR_CODES } from 'proton-shared/lib/errors';
import { c } from 'ttag';
import { EmailInput, Input, IntlTelInput, InlineLinkButton, PrimaryButton, Label } from '../../../components';
import { useApi, useLoading, useModals, useNotifications } from '../../../hooks';
import { classnames } from '../../../helpers';

import RequestNewCodeModal from './RequestNewCodeModal';
import InvalidVerificationCodeModal from './InvalidVerificationCodeModal';

const STEPS = {
    ENTER_DESTINATION: 0,
    VERIFY_CODE: 1,
};

const METHODS = {
    EMAIL: 'email',
    SMS: 'sms',
} as const;

interface Props {
    email?: string;
    method: 'email' | 'sms';
    mode: 'signup' | undefined;
    onSubmit: (token: string) => void;
}
const CodeVerification = ({ email: defaultEmail = '', mode, method, onSubmit }: Props) => {
    const isEmailMethod = method === METHODS.EMAIL;
    const isSmsMethod = method === METHODS.SMS;
    const inputCodeRef = useRef<HTMLInputElement>(null);
    const { createNotification } = useNotifications();
    const [email, setEmail] = useState(defaultEmail);
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const codeError = !code
        ? c('Input error').t`This field is required`
        : code.length < 6
        ? c('Error').t`The code is not the right length`
        : '';
    const [step, setStep] = useState(STEPS.ENTER_DESTINATION);
    const api = useApi();
    const [loadingCode, withLoadingCode] = useLoading();
    const [loadingVerification, withLoadingVerification] = useLoading();
    const { createModal } = useModals();

    const sendCode = async () => {
        await api(queryVerificationCode(method, isEmailMethod ? { Address: email } : { Phone: phone }));
        setCode('');
        setStep(STEPS.VERIFY_CODE);
        const methodTo = isEmailMethod ? email : phone;
        createNotification({ text: c('Success').t`Code sent to ${methodTo}` });
        inputCodeRef.current?.focus();
    };

    const editDestination = () => {
        setStep(STEPS.ENTER_DESTINATION);
    };

    const verifyCode = async () => {
        try {
            await onSubmit(`${isEmailMethod ? email : phone}:${code}`.replace(/\s/g, ''));
        } catch (error) {
            const { data: { Code } = { Code: 0 } } = error;

            if (Code === API_CUSTOM_ERROR_CODES.TOKEN_INVALID) {
                createModal(
                    <InvalidVerificationCodeModal
                        onEdit={editDestination}
                        onResend={() => withLoadingCode(sendCode())}
                    />
                );
            }
        }
    };

    useEffect(() => {
        setStep(STEPS.ENTER_DESTINATION);
    }, [method]);

    if (step === STEPS.ENTER_DESTINATION && isEmailMethod) {
        const handleChangeEmail = (event: React.ChangeEvent<HTMLInputElement>) => {
            setEmail(event.target.value);
        };
        return (
            <>
                <Label htmlFor="email" className={classnames(['block', mode !== 'signup' && 'mb0-5'])}>{c('Label')
                    .t`Email address`}</Label>
                <div className="mb1">
                    <EmailInput
                        id="email"
                        autoFocus
                        value={email}
                        placeholder={c('Placeholder').t`Enter an email address`}
                        onChange={handleChangeEmail}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                withLoadingCode(sendCode());
                            }
                        }}
                        required
                    />
                </div>
                <div className="text-right mt2">
                    <PrimaryButton
                        className="button--large"
                        disabled={!email || !validateEmailAddress(email)}
                        loading={loadingCode}
                        onClick={() => withLoadingCode(sendCode())}
                    >{c('Action').t`Send code`}</PrimaryButton>
                </div>
            </>
        );
    }

    if (step === STEPS.ENTER_DESTINATION && isSmsMethod) {
        const handleChangePhone = (status: any, value: any, countryData: any, number: string) => setPhone(number);
        return (
            <>
                <Label htmlFor="phone" className={classnames(['block', mode !== 'signup' && 'mb0-5'])}>{c('Label')
                    .t`Phone number`}</Label>
                <div className="mb1">
                    <IntlTelInput
                        id="phone"
                        defaultValue={phone}
                        autoFocus
                        containerClassName="w100"
                        inputClassName="w100"
                        dropdownContainer="body"
                        onPhoneNumberChange={handleChangePhone}
                        required
                    />
                </div>
                <div className="text-right mt2">
                    <PrimaryButton
                        className="button--large"
                        disabled={!phone}
                        loading={loadingCode}
                        onClick={() => withLoadingCode(sendCode())}
                    >{c('Action').t`Send code`}</PrimaryButton>
                </div>
            </>
        );
    }

    if (step === STEPS.VERIFY_CODE) {
        const destinationText = <strong key="destination">{isEmailMethod ? email : phone}</strong>;
        const handleChangeCode = (event: React.ChangeEvent<HTMLInputElement>) => {
            const newCode = event.target.value;

            if (!newCode || isNumber(newCode)) {
                setCode(newCode);
            }
        };
        return (
            <>
                {(isEmailMethod ? email : phone) ? (
                    <div className="mt0-5 mb0-5">
                        <div>{c('Info').jt`Enter the verification code that was sent to ${destinationText}.`}</div>
                        {isEmailMethod ? (
                            <div>{c('Info')
                                .t`If you don't find the email in your inbox, please check your spam folder.`}</div>
                        ) : null}
                    </div>
                ) : null}
                <Label htmlFor="code" className={classnames(['block', mode !== 'signup' && 'mb0-5'])}>{c('Label')
                    .t`Verification code`}</Label>
                <div className="mb0-5">
                    <Input
                        id="code"
                        ref={inputCodeRef}
                        value={code}
                        maxLength={6}
                        placeholder="123456"
                        onChange={handleChangeCode}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                return withLoadingVerification(verifyCode());
                            }
                        }}
                        autoFocus
                        required
                        error={codeError}
                    />
                </div>
                <div className="mb1">
                    <InlineLinkButton
                        onClick={() =>
                            createModal(
                                <RequestNewCodeModal
                                    onEdit={editDestination}
                                    onResend={() => withLoadingCode(sendCode())}
                                    email={email}
                                    phone={phone}
                                />
                            )
                        }
                    >{c('Action').t`Did not receive the code?`}</InlineLinkButton>
                </div>
                <div className="text-right mt2">
                    <InlineLinkButton onClick={editDestination} className="mr1">{c('Action')
                        .t`Change verification`}</InlineLinkButton>
                    <PrimaryButton
                        className="button--large"
                        disabled={!!codeError}
                        loading={loadingVerification}
                        onClick={() => withLoadingVerification(verifyCode())}
                    >{c('Action').t`Verify`}</PrimaryButton>
                </div>
            </>
        );
    }

    return null;
};

export default CodeVerification;
