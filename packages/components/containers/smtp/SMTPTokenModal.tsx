import { useState } from 'react';

import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import { useApi, useFormErrors, useNotifications } from '@proton/components';
import Copy from '@proton/components/components/button/Copy';
import PrimaryButton from '@proton/components/components/button/PrimaryButton';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import { useLoading } from '@proton/hooks';
import { createToken } from '@proton/shared/lib/api/smtptokens';
import { ADDRESS_TYPE } from '@proton/shared/lib/constants';
import { maxLengthValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Address } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import './SMTPTokenModal.scss';

const Steps = {
    TokenForm: 0,
    TokenValue: 1,
};

const SMTP_SERVER = 'smtp.protonmail.ch';
const SMTP_PORT = '587';

interface Props extends ModalProps {
    addresses: Address[];
    onCreate: () => void; // fetch new tokens
}

const SMTPTokenModal = ({ addresses, onCreate, ...rest }: Props) => {
    const { onClose } = rest;
    const { validator, onFormSubmit } = useFormErrors();
    const [step, setStep] = useState(Steps.TokenForm);
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const [tokenName, setTokenName] = useState('');
    const [token, setToken] = useState('');
    // This modal can be open only if it has at least one custom address
    const customAddresses = addresses.filter(({ Type }) => Type === ADDRESS_TYPE.TYPE_CUSTOM_DOMAIN);
    const [addressID, setAddressID] = useState(customAddresses[0].ID);
    const api = useApi();
    const title = step === Steps.TokenForm ? c('Title').t`Generate SMTP token` : c('Title').t`Your SMTP token`;
    const emailAddress = addresses.find(({ ID }) => ID === addressID)?.Email || '';

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

    const handleCopyEmail = () => {
        createNotification({ type: 'success', text: c('Success').t`Email address copied to clipboard` });
    };

    const handleCopyToken = () => {
        createNotification({ type: 'success', text: c('Success').t`Token copied to clipboard` });
    };

    const handleCopyServer = () => {
        createNotification({ type: 'success', text: c('Success').t`Server copied to clipboard` });
    };

    const handleCopyPort = () => {
        createNotification({ type: 'success', text: c('Success').t`Port copied to clipboard` });
    };

    const content = () => {
        if (step === Steps.TokenForm) {
            return (
                <>
                    <p>{c('Info')
                        .t`Give the token a descriptive name, such as the service you plan to use it with, and select one of your active custom domain addresses. Only this address will be able to send emails with this token.`}</p>
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
                <p>
                    {c('Info')
                        .t`Use the selected email address as the SMTP username in the external service, and the generated token as the SMTP password.`}
                    <br />
                    <Href href={getKnowledgeBaseUrl('/smtp-submission')}>{c('Link').t`Learn more`}</Href>
                </p>
                <div className="flex items-center flex-nowrap mb-4">
                    <InputFieldTwo
                        id="smtp-username"
                        label={c('Label').t`SMTP username`}
                        readOnly
                        value={emailAddress}
                        inputClassName="bg-weak"
                    />
                    <Copy
                        color="norm"
                        shape="solid"
                        value={emailAddress}
                        className="smtp-token-copy relative shrink-0 ml-2"
                        onCopy={handleCopyEmail}
                    />
                </div>
                <div className="flex items-center flex-nowrap mb-4">
                    <InputFieldTwo
                        id="smtp-token"
                        label={c('Label').t`SMTP token`}
                        readOnly
                        value={token}
                        inputClassName="bg-weak"
                    />
                    <Copy
                        color="norm"
                        shape="solid"
                        value={token}
                        className="smtp-token-copy relative shrink-0 ml-2"
                        onCopy={handleCopyToken}
                    />
                </div>
                <p className="color-danger">{c('Info')
                    .t`This token won’t be available after you close this window, and you should not share it with anyone.`}</p>
                <div className="flex items-center flex-nowrap mb-4">
                    <InputFieldTwo
                        id="server"
                        label={c('Label').t`SMTP server`}
                        readOnly
                        value={SMTP_SERVER}
                        inputClassName="bg-weak"
                    />
                    <Copy
                        color="norm"
                        shape="solid"
                        value={SMTP_SERVER}
                        className="smtp-token-copy relative shrink-0 ml-2"
                        onCopy={handleCopyServer}
                    />
                </div>
                <div className="flex items-center flex-nowrap mb-4">
                    <InputFieldTwo
                        id="port"
                        label={c('Label').t`SMTP port`}
                        readOnly
                        value={SMTP_PORT}
                        inputClassName="bg-weak"
                    />
                    <Copy
                        color="norm"
                        shape="solid"
                        value={SMTP_PORT}
                        className="smtp-token-copy relative shrink-0 ml-2"
                        onCopy={handleCopyPort}
                    />
                </div>
                <p>{c('Info').t`Enable TLS or SSL on the external service if it is supported.`}</p>
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
                <Button shape="outline" color="norm" className="ml-auto" onClick={handleClose}>{c('Action')
                    .t`Close`}</Button>
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
