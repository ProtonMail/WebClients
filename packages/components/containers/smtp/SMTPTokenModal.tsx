import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Copy,
    Form,
    InputFieldTwo,
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
import noop from '@proton/utils/noop';

const Steps = {
    Form: 0,
    Generated: 1,
};

interface Props extends ModalProps {
    addresses: Address[];
    onCreate: () => void; // fetch new tokens
}

const SMTPTokenModal = ({ addresses, onCreate, ...rest }: Props) => {
    const { onClose } = rest;
    const { validator, onFormSubmit } = useFormErrors();
    const [step, setStep] = useState(Steps.Form);
    const [loading, withLoading] = useLoading();
    const [tokenName, setTokenName] = useState('');
    const [token, setToken] = useState('');
    // This modal can be open only if it has at least one custom address
    const customAddresses = addresses.filter(({ Type }) => Type === ADDRESS_TYPE.TYPE_CUSTOM_DOMAIN);
    const [addressID, setAddressID] = useState(customAddresses[0].ID);
    const api = useApi();
    const title = step === Steps.Form ? c('Title').t`Generate SMTP token` : c('Title').t`Your SMTP token`;

    const handleClose = loading ? noop : onClose;

    const handleSubmit = async () => {
        if (step === Steps.Form) {
            if (loading || !onFormSubmit()) {
                return;
            }
            const { SmtpTokenCode } = await api(createToken(addressID, tokenName));
            setToken(SmtpTokenCode);
            setStep(Steps.Generated);
            onCreate();
        }
    };

    const content = () => {
        if (step === Steps.Form) {
            return (
                <>
                    <p>{c('Info')
                        .t`Give the token a descriptive name, such as the service you plan to use it with. The selected email address will be used for sending and will appear as the username and outgoing address.`}</p>
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
                <p>{c('Info').t`Token successfully generated. Use it as the SMTP password in the external service.`}</p>
                <div className="flex flex-align-items-center flex-nowrap">
                    <code className="user-select bg-weak flex-item-fluid p0-75 rounded">{token}</code>
                    <Copy value={token} autoFocus className="flex-item-noshrink ml0-5" />
                </div>
                <p className="color-weak">{c('Info')
                    .t`This token won’t be available after you close this window, and you should not share it with anyone.`}</p>
            </>
        );
    };

    const footer = () => {
        if (step === Steps.Form) {
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
