import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { useState } from 'react';
import { Address, Domain } from '@proton/shared/lib/interfaces';
import { c, msgid } from 'ttag';
import { DomainsModel } from '@proton/shared/lib/models';
import { loadModels } from '@proton/shared/lib/models/helper';
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
import { useApi, useCache, useOrganization, useDomains, useLoading, useUser, useDomainsAddresses } from '../../hooks';
import DomainModal from './DomainModal';
import RestoreAdministratorPrivileges from '../organization/RestoreAdministratorPrivileges';
import { SettingsSectionWide, SettingsParagraph, UpgradeBanner } from '../account';
import DeleteDomainModal from './DeleteDomainModal';
import CatchAllModal from './CatchAllModal';
import DomainName from './DomainName';
import DomainStatus from './DomainStatus';

const DomainsSectionText = () => {
    return (
        <SettingsParagraph
            className="text-cut"
            learnMoreUrl="https://protonmail.com/support/categories/custom-domains/"
        >
            {c('Message')
                .t`Set up a custom domain email address (e.g., you@yourcompany.com). It only takes a few minutes, and our wizard will guide you through the process.`}
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

    const [tmpDomainProps, setTmpDomainProps] = useState<{ domain: Domain; domainAddresses: Address[] } | null>(null);
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
    return (
        <SettingsSectionWide>
            <DomainsSectionText />
            <UpgradeBanner>
                {c('Message').t`Upgrade to any paid plan to use custom domains and unlock premium features`}
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
