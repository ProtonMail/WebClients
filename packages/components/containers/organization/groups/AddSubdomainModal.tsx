import React, { useState } from 'react';

import { c } from 'ttag';

import { addSubdomain } from '@proton/account/groups/actions';
import { Button, Href } from '@proton/atoms';
import { useApi, useEventManager, useFormErrors } from '@proton/components';
import InputFieldStacked from '@proton/components/components/inputFieldStacked/InputFieldStacked';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import { useLoading } from '@proton/hooks';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import noop from '@proton/utils/noop';

interface Props extends ModalProps {
    prefilledDomainName: string;
    setSelectedDomain: (domain: string) => void;
    pmMeDomain: string;
}

const AddSubdomainModal = ({ prefilledDomainName, open, setSelectedDomain, onClose, pmMeDomain }: Props) => {
    const [domainName, setDomainName] = useState(prefilledDomainName);
    const [loading, withLoading] = useLoading();
    const { validator, onFormSubmit } = useFormErrors();
    const api = useApi();
    const { call } = useEventManager();

    const protonSubdomain = <span className="text-bold">{pmMeDomain}</span>;
    const learnMoreLink = <Href href={getKnowledgeBaseUrl('')}>{c('cta').t`Learn more`}</Href>;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!onFormSubmit()) {
            return;
        }

        const Domain = await addSubdomain(api, domainName + pmMeDomain);
        setSelectedDomain(Domain.DomainName);
        await call();
        onClose?.();
    };

    return (
        <ModalTwo
            as="form"
            disableCloseOnEscape={loading}
            open={open}
            onClose={onClose}
            onSubmit={(e) => withLoading(handleSubmit(e)).catch(noop)}
            size="small"
        >
            <ModalTwoHeader closeButtonProps={{ disabled: loading }} title={c('Title').t`Add pm.me subdomain`} />
            <ModalTwoContent>
                <div className="mb-4">{c('Info')
                    .jt`A ${protonSubdomain} is hosted by ${BRAND_NAME}, which allows you to quickly set up a subdomain. ${learnMoreLink}`}</div>
                <InputFieldStacked icon="at">
                    <InputFieldTwo
                        id="domain-name"
                        autoFocus
                        value={domainName}
                        label={c('Label').t`Domain name`}
                        placeholder="mycompany"
                        onValue={(name: string) => {
                            setDomainName(name);
                        }}
                        required
                        unstyled
                        suffix={pmMeDomain}
                        error={validator([requiredValidator(domainName)])}
                    />
                </InputFieldStacked>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="button" onClick={onClose} disabled={loading}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button type="submit" loading={loading} color="norm">
                    {c('Action').t`Create`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default AddSubdomainModal;
