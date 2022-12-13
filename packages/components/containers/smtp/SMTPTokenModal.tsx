import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Copy,
    Form,
    InputFieldTwo,
    Label,
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    Option,
    PrimaryButton,
    SelectTwo,
    useApi,
    useFormErrors,
    useLoading,
} from '@proton/components';
import { createToken } from '@proton/shared/lib/api/smtptokens';
import { ADDRESS_TYPE } from '@proton/shared/lib/constants';
import { maxLengthValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { Address } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

const Steps = {
    TokenForm: 0,
    TokenValue: 1,
};

interface Props extends ModalProps {
    addresses: Address[];
    onCreate: () => void; // fetch new tokens
}

const SMTPTokenModal = ({ addresses, onCreate, ...rest }: Props) => {
    const { onClose } = rest;
    const { validator, onFormSubmit } = useFormErrors();
    const [step, setStep] = useState(Steps.TokenForm);
    const [loading, withLoading] = useLoading();
    const [tokenName, setTokenName] = useState('');
    const [token, setToken] = useState('');
    // This modal can be open only if it has at least one custom address
    const customAddresses = addresses.filter(({ Type }) => Type === ADDRESS_TYPE.TYPE_CUSTOM_DOMAIN);
    const [addressID, setAddressID] = useState(customAddresses[0].ID);
    const api = useApi();
    const title =
        step === Steps.TokenForm ? c('Title').t`Generate SMTP token` : c('Title').t`Token successfully generated`;
    const emailAddress = addresses.find(({ ID }) => ID === addressID)?.Email || '';
    const tokenParts = token.match(/.{1,4}/g) || []; // Split token in 4 characters parts

    const handleClose = loading ? noop : onClose;

    const handleSubmit = async () => {
        if (step === Steps.TokenForm) {
            if (loading || !onFormSubmit()) {
                return;
            }
            const { SmtpTokenCode } = await api(createToken(addressID, tokenName));
            setToken(SmtpTokenCode);
            setStep(Steps.TokenValue);
            onCreate();
        }
    };

    const content = () => {
        if (step === Steps.TokenForm) {
            return (
                <>
                    <p>{c('Info')
                        .t`Give the token a descriptive name, such as the service you plan to use it with, and select one of your active custom domain address. Only this address will be able to send emails with this token.`}</p>
                    <InputFieldTwo
                        label={c('Label').t`Token name`}
                        id="token-name"
                        autoFocus
                        maxLength={100}
                        error={validator([requiredValidator(tokenName), maxLengthValidator(tokenName, 100)])}
                        placeholder={c('Placeholder').t`Printer`}
                        value={tokenName}
                        onValue={(value: string) => setTokenName(value)}
                        disabled={loading}
                        required
                    />
                    <InputFieldTwo
                        as={SelectTwo}
                        id="token-address"
                        label={c('Label').t`Email address`}
                        value={addressID}
                        onValue={(value: unknown) => setAddressID(value as string)}
                        disabled={loading}
                    >
                        {customAddresses.map(({ ID, Email }) => (
                            <Option key={ID} value={ID} title={Email} />
                        ))}
                    </InputFieldTwo>
                </>
            );
        }
        return (
            <>
                <p>{c('Info')
                    .t`Use the selected email address as the SMTP username in the external service, and the generated token as the SMTP password.`}</p>
                <Label className="text-bold block" htmlFor="smtp-username">{c('Label').t`SMTP username`}</Label>
                <div className="flex flex-align-items-center flex-nowrap mb1">
                    <code id="smtp-username" className="user-select bg-weak flex-item-fluid p0-75 rounded">
                        {emailAddress}
                    </code>
                    <Copy value={emailAddress} className="flex-item-noshrink ml0-5" />
                </div>
                <Label className="text-bold block" htmlFor="smtp-token">{c('Label').t`SMTP token`}</Label>
                <div className="flex flex-align-items-center flex-nowrap mb1">
                    <code id="smtp-token" className="user-select bg-weak flex-item-fluid p0-75 rounded">
                        {tokenParts.map((part, index) => (
                            <span key={`${part}${index}`} className={clsx(index > 0 && 'ml0-5')}>
                                {part}
                            </span>
                        ))}
                    </code>
                    <Copy value={token} className="flex-item-noshrink ml0-5" />
                </div>
                <p className="color-weak">{c('Info')
                    .t`This token won’t be available after you close this window, and you should not share it with anyone.`}</p>
            </>
        );
    };

    const footer = () => {
        if (step === Steps.TokenForm) {
            return (
                <>
                    <Button onClick={handleClose}>{c('Action').t`Cancel`}</Button>
                    <PrimaryButton type="submit" loading={loading}>
                        {c('Action').t`Generate`}
                    </PrimaryButton>
                </>
            );
        }
        return (
            <>
                <PrimaryButton className="mlauto" onClick={handleClose}>{c('Action').t`Close`}</PrimaryButton>
            </>
        );
    };

    return (
        <ModalTwo as={Form} onSubmit={() => withLoading(handleSubmit())} onClose={handleClose} {...rest}>
            <ModalTwoHeader closeButtonProps={{ disabled: loading }} title={title} />
            <ModalTwoContent>{content()}</ModalTwoContent>
            <ModalTwoFooter>{footer()}</ModalTwoFooter>
        </ModalTwo>
    );
};

export default SMTPTokenModal;
