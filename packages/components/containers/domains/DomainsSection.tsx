import { useState } from 'react';

import { c, msgid } from 'ttag';

import { BRAND_NAME, PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';
import { getDomainsSupportURL } from '@proton/shared/lib/helpers/url';
import { Domain, DomainAddress } from '@proton/shared/lib/interfaces';
import { DomainsModel } from '@proton/shared/lib/models';
import { loadModels } from '@proton/shared/lib/models/helper';
import isTruthy from '@proton/utils/isTruthy';

import {
    Button,
    DropdownActions,
    Loader,
    Table,
    TableBody,
    TableHeader,
    TableRow,
    useModalState,
} from '../../components';
import { useApi, useCache, useDomains, useDomainsAddresses, useLoading, useOrganization, useUser } from '../../hooks';
import { SettingsParagraph, SettingsSectionWide, UpgradeBanner } from '../account';
import RestoreAdministratorPrivileges from '../organization/RestoreAdministratorPrivileges';
import CatchAllModal from './CatchAllModal';
import DeleteDomainModal from './DeleteDomainModal';
import DomainModal from './DomainModal';
import DomainName from './DomainName';
import DomainStatus from './DomainStatus';

const DomainsSectionText = () => {
    return (
        <SettingsParagraph className="text-cut" learnMoreUrl={getDomainsSupportURL()}>
            {c('Message')
                .t`Connect your custom domain to ${BRAND_NAME} to set up custom email addresses (e.g., you@yourcompany.com). Our wizard will guide you through the process.`}
        </SettingsParagraph>
    );
};

const DomainsSectionInternal = () => {
    const api = useApi();
    const cache = useCache();
    const [domains, loadingDomains] = useDomains();
    const [domainsAddressesMap, loadingDomainsAddressesMap] = useDomainsAddresses(domains);
    const [organization, loadingOrganization] = useOrganization();
    const [loadingRefresh, withLoadingRefresh] = useLoading();

    const [tmpDomainProps, setTmpDomainProps] = useState<{ domain: Domain; domainAddresses: DomainAddress[] } | null>(
        null
    );
    const [newDomainModalProps, setNewDomainModalOpen, renderNewDomain] = useModalState();
    const [editDomainModalProps, setEditDomainModalOpen, renderEditDomain] = useModalState();
    const [deleteDomainModalProps, setDeleteDomainModalOpen, renderDeleteDomain] = useModalState();
    const [catchAllDomainModalProps, setCatchAllDomainModalOpen, renderCatchAllDomain] = useModalState();

    const allModelsArePresent = domains && domainsAddressesMap && organization;

    const loading = !allModelsArePresent && (loadingDomains || loadingDomainsAddressesMap || loadingOrganization);

    const UsedDomains = organization?.UsedDomains || 0;
    const MaxDomains = organization?.MaxDomains || 0;

    const handleRefresh = async () => {
        await loadModels([DomainsModel], { api, cache, useCache: false });
    };

    return (
        <SettingsSectionWide>
            {renderNewDomain && <DomainModal {...newDomainModalProps} />}
            {renderEditDomain && tmpDomainProps && (
                <DomainModal
                    domain={tmpDomainProps.domain}
                    domainAddresses={tmpDomainProps.domainAddresses}
                    {...editDomainModalProps}
                />
            )}
            {renderDeleteDomain && tmpDomainProps && (
                <DeleteDomainModal domain={tmpDomainProps.domain} {...deleteDomainModalProps} />
            )}
            {renderCatchAllDomain && tmpDomainProps && (
                <CatchAllModal
                    domain={tmpDomainProps.domain}
                    domainAddresses={tmpDomainProps.domainAddresses}
                    {...catchAllDomainModalProps}
                />
            )}

            {loading ? (
                <Loader />
            ) : (
                <>
                    <RestoreAdministratorPrivileges />
                    <DomainsSectionText />

                    <div className="mb1">
                        <Button color="norm" onClick={() => setNewDomainModalOpen(true)} className="mr1">
                            {c('Action').t`Add domain`}
                        </Button>
                        <Button
                            loading={loadingRefresh || loadingDomainsAddressesMap}
                            onClick={() => withLoadingRefresh(handleRefresh())}
                        >{c('Action').t`Refresh status`}</Button>
                    </div>
                    {!!domains?.length && domainsAddressesMap && (
                        <Table className="simple-table--has-actions">
                            <TableHeader
                                cells={[
                                    c('Header for addresses table').t`Domain`,
                                    c('Header for addresses table').t`Status`,
                                    c('Header for addresses table').t`Actions`,
                                ]}
                            />
                            <TableBody loading={loading} colSpan={4}>
                                {domains.map((domain) => {
                                    const domainAddresses = domainsAddressesMap[domain.ID] || [];
                                    return (
                                        <TableRow
                                            key={domain.ID}
                                            cells={[
                                                <DomainName domain={domain} />,
                                                <DomainStatus domain={domain} domainAddresses={domainAddresses} />,
                                                <DropdownActions
                                                    size="small"
                                                    list={[
                                                        {
                                                            text: c('Action').t`Review`,
                                                            onClick: () => {
                                                                setTmpDomainProps({ domain, domainAddresses });
                                                                setEditDomainModalOpen(true);
                                                            },
                                                        } as const,
                                                        Array.isArray(domainAddresses) &&
                                                            domainAddresses.length &&
                                                            ({
                                                                text: c('Action').t`Set catch-all`,
                                                                onClick: () => {
                                                                    setTmpDomainProps({ domain, domainAddresses });
                                                                    setCatchAllDomainModalOpen(true);
                                                                },
                                                            } as const),
                                                        {
                                                            text: c('Action').t`Delete`,
                                                            actionType: 'delete',
                                                            onClick: () => {
                                                                setTmpDomainProps({ domain, domainAddresses });
                                                                setDeleteDomainModalOpen(true);
                                                            },
                                                        } as const,
                                                    ].filter(isTruthy)}
                                                />,
                                            ]}
                                        />
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                    <div className="mb1 color-weak">
                        {UsedDomains} / {MaxDomains}{' '}
                        {c('Info').ngettext(msgid`domain used`, `domains used`, MaxDomains)}
                    </div>
                </>
            )}
        </SettingsSectionWide>
    );
};

const DomainsSectionUpgrade = () => {
    const plus = PLAN_NAMES[PLANS.MAIL];
    const bundle = PLAN_NAMES[PLANS.BUNDLE];
    return (
        <SettingsSectionWide>
            <DomainsSectionText />
            <UpgradeBanner>
                {c('new_plans: upgrade').t`Included with ${plus}, ${bundle}, and ${BRAND_NAME} for Business.`}
            </UpgradeBanner>
        </SettingsSectionWide>
    );
};

const DomainsSection = () => {
    const [{ isAdmin, isSubUser }] = useUser();
    const hasPermission = isAdmin && !isSubUser;

    return hasPermission ? <DomainsSectionInternal /> : <DomainsSectionUpgrade />;
};

export default DomainsSection;
