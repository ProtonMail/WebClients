import React, { useState } from 'react';

import { c } from 'ttag';

import { addSubdomain } from '@proton/account/groups/actions';
import { useApi } from '@proton/app-context/useApi';
import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import { useLoading } from '@proton/hooks';
import { IcAt } from '@proton/icons/icons/IcAt';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import noop from '@proton/utils/noop';

import InputFieldStacked from '../../../components/inputFieldStacked/InputFieldStacked';
import type { ModalProps } from '../../../components/modalTwo/Modal';
import ModalTwo from '../../../components/modalTwo/Modal';
import ModalTwoContent from '../../../components/modalTwo/ModalContent';
import ModalTwoFooter from '../../../components/modalTwo/ModalFooter';
import ModalTwoHeader from '../../../components/modalTwo/ModalHeader';
import InputFieldTwo from '../../../components/v2/field/InputField';
import useFormErrors from '../../../components/v2/useFormErrors';
import useEventManager from '../../../hooks/useEventManager';

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

    const protonSubdomain = (
        <span className="text-bold" key="eslint-autofix-B187AD">
            {pmMeDomain}
        </span>
    );
    const learnMoreLink = (
        <Href href={getKnowledgeBaseUrl('')} key="eslint-autofix-3DAEF2">{c('cta').t`Learn more`}</Href>
    );

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
                <InputFieldStacked icon={<IcAt />}>
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
