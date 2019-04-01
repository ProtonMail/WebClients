import React from 'react';
import { c } from 'ttag';
import {
    useEventManager,
    useOrganization,
    useDomains,
    SubTitle,
    Alert,
    PrimaryButton,
    Button,
    Block,
    useModal
} from 'react-components';

import DomainModal from './DomainModal';
import DomainsTable from './DomainsTable';

const DomainsSection = () => {
    const [domains, loading] = useDomains();
    const [organization] = useOrganization();
    const { isOpen, open, close } = useModal();
    const { UsedDomains, MaxDomains } = organization;
    const { call } = useEventManager(); // TODO: Use event manager or expose a refresh fn in the models?

    return (
        <>
            <SubTitle>{c('Title').t`Manage custom domains`}</SubTitle>
            <Alert learnMore="https://protonmail.com/support/categories/custom-domains/">
                {c('Message')
                    .t`Add a custom filter to perform actions such as automatically labeling or archiving messages.`}
            </Alert>
            <Block>
                <PrimaryButton onClick={open} className="mr1">{c('Action').t`Add domain`}</PrimaryButton>
                <DomainModal show={isOpen} onClose={close} />
                <Button disabled={loading} onClick={call}>{c('Action').t`Refresh status`}</Button>
            </Block>
            {!loading && !domains.length ? <Alert>{c('Info').t`No domains yet`}</Alert> : null}
            {loading ? null : <DomainsTable domains={domains} />}
            <Block>
                {UsedDomains} / {MaxDomains} {c('Info').t`domains used`}
            </Block>
        </>
    );
};

export default DomainsSection;
