import React from 'react';
import { c, msgid } from 'ttag';
import { DomainsModel } from 'proton-shared/lib/models';
import { loadModels } from 'proton-shared/lib/models/helper';

import { Alert, PrimaryButton, Button, Block, Loader } from '../../components';
import { useApi, useCache, useOrganization, useDomains, useModals, useLoading } from '../../hooks';
import DomainModal from './DomainModal';
import DomainsTable from './DomainsTable';
import RestoreAdministratorPrivileges from '../organization/RestoreAdministratorPrivileges';
import useDomainsAddresses from '../../hooks/useDomainsAddresses';

const DomainsSection = () => {
    const api = useApi();
    const cache = useCache();
    const [domains, loadingDomains] = useDomains();
    const [domainsAddressesMap, loadingDomainsAddressesMap] = useDomainsAddresses(domains);
    const [organization, loadingOrganization] = useOrganization();
    const [loading, withLoading] = useLoading();
    const { createModal } = useModals();

    if (loadingDomains || loadingDomainsAddressesMap || loadingOrganization) {
        return <Loader />;
    }

    const { UsedDomains, MaxDomains } = organization;

    const handleRefresh = async () => {
        await loadModels([DomainsModel], { api, cache, useCache: false });
    };

    return (
        <>
            <RestoreAdministratorPrivileges />
            <Alert learnMore="https://protonmail.com/support/categories/custom-domains/">
                {c('Message')
                    .t`Add a domain to receive emails to your custom email addresses and to add more users to your organization (Visionary and Professional accounts only).`}
            </Alert>
            <Block>
                <PrimaryButton onClick={() => createModal(<DomainModal />)} className="mr1">
                    {c('Action').t`Add domain`}
                </PrimaryButton>
                <Button loading={loading} onClick={() => withLoading(handleRefresh())}>{c('Action')
                    .t`Refresh status`}</Button>
            </Block>
            {!domains.length ? null : <DomainsTable domains={domains} domainsAddressesMap={domainsAddressesMap} />}
            <Block className="color-weak">
                {UsedDomains} / {MaxDomains} {c('Info').ngettext(msgid`domain used`, `domains used`, UsedDomains)}
            </Block>
        </>
    );
};

export default DomainsSection;
