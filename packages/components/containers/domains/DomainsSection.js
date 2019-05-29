import React from 'react';
import { c, msgid } from 'ttag';
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
    const open = () => createModal(<DomainModal />);

    return (
        <>
            <SubTitle>{c('Title').t`Custom domains`}</SubTitle>
            <Alert learnMore="https://protonmail.com/support/categories/custom-domains/">
                {c('Message')
                    .t`Add a domain to receive emails to your custom email addresses and to add more users to your organization (Visionary and Professional accounts only).`}
            </Alert>
            <Block>
                <PrimaryButton onClick={open} className="mr1">{c('Action').t`Add domain`}</PrimaryButton>
                <Button disabled={loading} onClick={call}>{c('Action').t`Refresh status`}</Button>
            </Block>
            {!loading && !domains.length ? <Alert>{c('Info').t`No domains yet.`}</Alert> : null}
            {!loading && domains.length ? <DomainsTable domains={domains} /> : null}
            <Block className="opacity-50">
                {UsedDomains} / {MaxDomains} {c('Info').ngettext(msgid`domain used`, `domains used`, UsedDomains)}
            </Block>
        </>
    );
};

export default DomainsSection;
