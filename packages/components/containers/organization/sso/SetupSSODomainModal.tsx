import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import Icon from '@proton/components/components/icon/Icon';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import useLoading from '@proton/hooks/useLoading';
import metrics, { observeApiError } from '@proton/metrics';
import { addDomain, getDomain } from '@proton/shared/lib/api/domains';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import type { Domain } from '@proton/shared/lib/interfaces';
import { VERIFY_STATE } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { InputFieldTwo, useFormErrors } from '../../../components';
import { useApi, useEventManager } from '../../../hooks';
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

    useEffect(() => {
        const stepLabel = (() => {
            if (step === STEP.TXT_RECORD) {
                return 'txt-record';
            }

            return 'domain-input';
        })();

        void metrics.core_sso_setup_domain_modal_load_total.increment({ step: stepLabel });
    }, [step]);

    const api = useApi();
    const { call } = useEventManager();
    const [submitting, withSubmitting] = useLoading();
    const [loadingVerification, withLoadingVerification] = useLoading();

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

                try {
                    const { Domain } = await api<{ Domain: Domain }>(
                        addDomain({ Name: domainName, AllowedForMail: false, AllowedForSSO: true })
                    );
                    setDomain(Domain);

                    await call();
                    setStep(STEP.TXT_RECORD);
                } catch (error) {
                    observeApiError(error, (status) =>
                        metrics.core_sso_setup_domain_total.increment({
                            status,
                        })
                    );

                    throw error;
                }
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
            const handleVerification = async () => {
                if (domain.VerifyState === VERIFY_STATE.VERIFY_STATE_GOOD) {
                    onContinue();
                    return;
                }
                const silentApi = getSilentApi(api);
                const result = await silentApi<{ Domain: Domain }>(getDomain(domain.ID)).catch(noop);
                if (result?.Domain.VerifyState === VERIFY_STATE.VERIFY_STATE_GOOD) {
                    call();
                }
                onContinue();
            };
            return {
                title: c('Info').t`Verify domain`,
                content: <TXTSection domain={domain} />,
                footer: (
                    <>
                        <Button onClick={onClose}>{c('Action').t`Close`}</Button>
                        <Button
                            loading={loadingVerification}
                            onClick={() => withLoadingVerification(handleVerification()).catch(noop)}
                            color="norm"
                        >
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
