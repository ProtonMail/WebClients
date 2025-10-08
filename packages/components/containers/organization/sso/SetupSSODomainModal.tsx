import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { createDomain, syncDomain } from '@proton/account/domains/actions';
import { Button } from '@proton/atoms/Button/Button';
import Form from '@proton/components/components/form/Form';
import Icon from '@proton/components/components/icon/Icon';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useLoading from '@proton/hooks/useLoading';
import metrics, { observeApiError } from '@proton/metrics';
import { useDispatch } from '@proton/redux-shared-store';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import type { Domain } from '@proton/shared/lib/interfaces';
import { VERIFY_STATE } from '@proton/shared/lib/interfaces';

import TXTSection from './TXTSection';
import type { SsoAppInfo } from './ssoAppInfo';

enum STEP {
    DOMAIN_INPUT,
    TXT_RECORD,
}

interface Props extends ModalProps {
    ssoAppInfo: SsoAppInfo;
    onDomainAdded?: (domain: Domain) => void;
    onContinue: () => void;
}

const SetupSSODomainModal = ({ onContinue, onDomainAdded, onClose, ssoAppInfo, ...rest }: Props) => {
    const [step, setStep] = useState(STEP.DOMAIN_INPUT);
    const [domainName, setDomainName] = useState('');
    const [domain, setDomain] = useState<Domain>();
    const dispatch = useDispatch();

    useEffect(() => {
        const stepLabel = (() => {
            if (step === STEP.TXT_RECORD) {
                return 'txt-record';
            }

            return 'domain-input';
        })();

        void metrics.core_sso_setup_domain_modal_load_total.increment({ step: stepLabel });
    }, [step]);

    const handleError = useErrorHandler();
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
                    const Domain = await dispatch(createDomain({ name: domainName, allowedForSSO: true }));
                    onDomainAdded?.(Domain);
                    setDomain(Domain);
                    setStep(STEP.TXT_RECORD);
                } catch (error) {
                    observeApiError(error, (status) =>
                        metrics.core_sso_setup_domain_total.increment({
                            status,
                        })
                    );
                    handleError(error);
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
                if (domain.VerifyState !== VERIFY_STATE.VERIFY_STATE_GOOD) {
                    await dispatch(syncDomain(domain));
                }
                onContinue();
            };
            return {
                title: c('Info').t`Verify domain`,
                content: <TXTSection domain={domain} ssoAppInfo={ssoAppInfo} />,
                footer: (
                    <>
                        <Button onClick={onClose}>{c('Action').t`Close`}</Button>
                        <Button
                            loading={loadingVerification}
                            onClick={() => withLoadingVerification(handleVerification()).catch(handleError)}
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
