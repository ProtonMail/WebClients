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
    useModals
} from 'react-components';

import DomainModal from './DomainModal';
import DomainsTable from './DomainsTable';

const DomainsSection = () => {
    const [domains, loading] = useDomains();
    const [organization] = useOrganization();
    const { createModal } = useModals();
    const { UsedDomains, MaxDomains } = organization;
    const { call } = useEventManager();

    const open = () => {
        createModal(<DomainModal />);
    };

    return (
        <>
            <SubTitle>{c('Title').t`Manage custom domains`}</SubTitle>
            <Alert learnMore="https://protonmail.com/support/categories/custom-domains/">
                {c('Message')
                    .t`Add a custom filter to perform actions such as automatically labeling or archiving messages.`}
            </Alert>
            <Block>
                <PrimaryButton onClick={open} className="mr1">{c('Action').t`Add domain`}</PrimaryButton>
                <Button disabled={loading} onClick={call}>{c('Action').t`Refresh status`}</Button>
            </Block>
            {!loading && !domains.length ? <Alert>{c('Info').t`No domains yet.`}</Alert> : null}
            {loading ? null : <DomainsTable domains={domains} />}
            <Block>
                {UsedDomains} / {MaxDomains} {c('Info').t`domains used`}
            </Block>
        </>
    );
};

export default DomainsSection;
