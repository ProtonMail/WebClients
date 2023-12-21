import { ReactNode, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useApi, useEventManager } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import { addDomain } from '@proton/shared/lib/api/domains';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { Domain } from '@proton/shared/lib/interfaces';

import {
    Form,
    Icon,
    InputFieldTwo,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
    useFormErrors,
} from '../../../components';
import TXTSection from './TXTSection';

enum STEP {
    DOMAIN_INPUT,
    TXT_RECORD,
}

interface Props extends ModalProps {
    onContinue: () => void;
}

const SetupSSODomainModal = ({ onContinue, onClose, ...rest }: Props) => {
    const [step, setStep] = useState(STEP.DOMAIN_INPUT);
    const [domainName, setDomainName] = useState('');
    const [domain, setDomain] = useState<Domain>();

    const api = useApi();
    const { call } = useEventManager();
    const [submitting, withSubmitting] = useLoading();
    const { validator, onFormSubmit } = useFormErrors();

    const {
        title,
        content,
        footer,
        onSubmit,
    }: { title: string; content: ReactNode; footer: ReactNode; onSubmit?: () => void } = (() => {
        if (step === STEP.DOMAIN_INPUT) {
            const handleSubmit = async () => {
                if (!onFormSubmit()) {
                    return;
                }

                const { Domain } = await api<{ Domain: Domain }>(addDomain(domainName));
                setDomain(Domain);

                await call();
                setStep(STEP.TXT_RECORD);
            };
            return {
                title: c('Info').t`Add domain`,
                onSubmit: () => withSubmitting(handleSubmit),
                content: (
                    <>
                        <div className="mb-6">
                            {c('Info').t`Specify the domain which is allowed to authenticate with SAML SSO.`}
                        </div>
                        <InputFieldTwo
                            id="domain"
                            prefix={<Icon name="globe" />}
                            label={c('Label').t`Allowed domain`}
                            placeholder={c('Label').t`e.g. example.com`}
                            error={validator([requiredValidator(domainName)])}
                            autoFocus
                            disableChange={submitting}
                            value={domainName}
                            onValue={setDomainName}
                        />
                    </>
                ),
                footer: (
                    <>
                        <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                        <Button type="submit" loading={submitting} color="norm">
                            {c('Action').t`Add domain`}
                        </Button>
                    </>
                ),
            };
        }

        if (step === STEP.TXT_RECORD && domain) {
            return {
                title: c('Info').t`Verify domain`,
                content: <TXTSection domain={domain} />,
                footer: (
                    <>
                        <Button onClick={onClose}>{c('Action').t`Close`}</Button>
                        <Button onClick={onContinue} color="norm">
                            {c('Action').t`Continue`}
                        </Button>
                    </>
                ),
            };
        }

        throw new Error('No step found');
    })();

    return (
        <Modal as={onSubmit ? Form : undefined} onSubmit={onSubmit} size="large" onClose={onClose} {...rest}>
            <ModalHeader title={title} />
            <ModalContent>{content}</ModalContent>
            <ModalFooter>{footer}</ModalFooter>
        </Modal>
    );
};

export default SetupSSODomainModal;
