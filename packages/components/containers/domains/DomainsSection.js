import React from 'react';
import { c, msgid } from 'ttag';
import { withRouter } from 'react-router';
import PropTypes from 'prop-types';
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
import RestoreAdministratorPrivileges from '../organization/RestoreAdministratorPrivileges';

const DomainsSection = ({ history }) => {
    const [domains, loadingDomains] = useDomains();
    const [organization] = useOrganization();
    const { createModal } = useModals();
    const { call } = useEventManager();

    const { UsedDomains, MaxDomains } = organization;

    const handleRedirect = (route) => {
        history.push(route);
    };

    return (
        <>
            <RestoreAdministratorPrivileges />
            <SubTitle>{c('Title').t`Custom domains`}</SubTitle>
            <Alert learnMore="https://protonmail.com/support/categories/custom-domains/">
                {c('Message')
                    .t`Add a domain to receive emails to your custom email addresses and to add more users to your organization (Visionary and Professional accounts only).`}
            </Alert>
            <Block>
                <PrimaryButton onClick={() => createModal(<DomainModal onRedirect={handleRedirect} />)} className="mr1">
                    {c('Action').t`Add domain`}
                </PrimaryButton>
                <Button disabled={loadingDomains} onClick={call}>{c('Action').t`Refresh status`}</Button>
            </Block>
            {!loadingDomains && !domains.length ? <Alert>{c('Info').t`No domains yet.`}</Alert> : null}
            {!loadingDomains && domains.length ? <DomainsTable domains={domains} onRedirect={handleRedirect} /> : null}
            <Block className="opacity-50">
                {UsedDomains} / {MaxDomains} {c('Info').ngettext(msgid`domain used`, `domains used`, UsedDomains)}
            </Block>
        </>
    );
};

DomainsSection.propTypes = {
    history: PropTypes.object.isRequired
};

export default withRouter(DomainsSection);
