import { useState } from 'react';

import { c, msgid } from 'ttag';

import { Banner } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Pill } from '@proton/atoms/Pill/Pill';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import DropdownActionsIcon from '@proton/components/components/dropdown/DropdownActionsIcon';
import SearchInput from '@proton/components/components/input/SearchInput';
import Info from '@proton/components/components/link/Info';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import { useModalStateWithData } from '@proton/components/components/modalTwo/useModalState';
import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeaderCell from '@proton/components/components/table/TableHeaderCell';
import TableRow from '@proton/components/components/table/TableRow';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import { IcCheckmarkCircle } from '@proton/icons/icons/IcCheckmarkCircle';
import { IcCircleSlash } from '@proton/icons/icons/IcCircleSlash';
import { IcPen } from '@proton/icons/icons/IcPen';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { IcThreeDotsVertical } from '@proton/icons/icons/IcThreeDotsVertical';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { ServiceAccount } from '@proton/shared/lib/interfaces/ServiceAccount';
import { ServiceAccountState } from '@proton/shared/lib/interfaces/ServiceAccount';
import isTruthy from '@proton/utils/isTruthy';

import CreateServiceAccountModal from './CreateServiceAccountModal';
import EditServiceAccountModal from './EditServiceAccountModal';
import ServiceAccountConfirmPrompt, { type ServiceAccountConfirmAction } from './ServiceAccountConfirmPrompt';
import { filterServiceAccounts } from './helpers';
import { useServiceAccounts } from './useServiceAccounts';

import './ServiceAccountsSection.scss';

const ServiceAccountStatus = ({ account }: { account: ServiceAccount }) => {
    const labels = {
        [ServiceAccountState.Disabled]: c('Service account status').t`Disabled`,
        [ServiceAccountState.NoManager]: c('Service account status').t`No manager`,
        [ServiceAccountState.NoTokens]: c('Service account status').t`No tokens`,
        [ServiceAccountState.Active]: c('Service account status').t`Active`,
    };
    let colors = { color: 'var(--text-norm)', backgroundColor: 'var(--background-strong)' };
    switch (account.State) {
        case ServiceAccountState.Active:
            colors = { color: 'var(--signal-success-major-3)', backgroundColor: 'var(--signal-success-minor-2)' };
            break;
        case ServiceAccountState.NoManager:
            colors = { color: 'var(--signal-warning-major-3)', backgroundColor: 'var(--signal-warning-minor-2)' };
            break;
    }

    return (
        <Pill className="text-uppercase text-semibold" rounded="rounded-sm" {...colors}>
            {labels[account.State] || c('Service account status').t`Unknown`}
        </Pill>
    );
};

const ServiceAccountsSection = () => {
    const {
        accounts,
        members,
        managerNames,
        usedNames,
        permissions,
        loading,
        error,
        refresh,
        checkEmail,
        create,
        save,
        remove,
        setEnabled,
    } = useServiceAccounts();
    const { canCreate, canUpdate, canDelete, canEdit } = permissions;
    const [query, setQuery] = useState('');
    // Opened without an account to create one.
    const [{ data: accountModal, ...accountModalProps }, openAccountModal, renderAccountModal] = useModalStateWithData<{
        account?: ServiceAccount;
    }>();
    const [{ data: confirmation, ...confirmModalProps }, openConfirmModal, renderConfirmModal] = useModalStateWithData<{
        account: ServiceAccount;
        action: ServiceAccountConfirmAction;
    }>();
    const { maxServiceAccounts, limitReached } = permissions;
    const limitMessage = c('Tooltip').ngettext(
        msgid`Your organization has reached its limit of ${maxServiceAccounts} service account.`,
        `Your organization has reached its limit of ${maxServiceAccounts} service accounts.`,
        maxServiceAccounts
    );
    // Creating refreshes the list before the account's keys and managers are set up: until it finishes, hide accounts
    // that were not listed when it started and show a placeholder row instead.
    const [listedBeforeCreation, setListedBeforeCreation] = useState<Set<string>>();
    const createAccount: typeof create = async (args) => {
        setListedBeforeCreation(new Set(accounts.map(({ MemberID }) => MemberID)));
        try {
            await create(args);
        } finally {
            setListedBeforeCreation(undefined);
        }
    };
    const listedAccounts = listedBeforeCreation
        ? accounts.filter(({ MemberID }) => listedBeforeCreation.has(MemberID))
        : accounts;
    const visibleAccounts = filterServiceAccounts(listedAccounts, query);
    const formProps = {
        ...accountModalProps,
        usedNames,
        members,
        excludedMemberIDs: accounts.map(({ MemberID }) => MemberID),
        canAssign: permissions.canAssignManagers,
        canRemove: permissions.canRemoveManagers,
    };

    // Service accounts need an address on a custom domain, so there is nothing to list or add without one.
    const showList = !permissions.showMissingDomainWarning;

    return (
        <SettingsSectionWide className="service-accounts">
            <SettingsParagraph className="mb-6" inlineLearnMore learnMoreUrl={getKnowledgeBaseUrl('/service-accounts')}>
                {c('Info')
                    .t`A service account is a machine identity that belongs to your organization rather than to a single user. Use it to automate ${BRAND_NAME} services through the CLI or API. No one can sign in to a service account—it acts only through access tokens.`}
            </SettingsParagraph>
            {showList && (
                <div className="flex justify-space-between items-center gap-4 mb-4">
                    <div className="w-full w-custom" style={{ '--w-custom': '19.5rem' }}>
                        <SearchInput
                            id="search-service-accounts"
                            placeholder={c('Placeholder').t`Search for a service account`}
                            value={query}
                            onChange={setQuery}
                            disabled={!accounts.length}
                        />
                    </div>
                    {permissions.hasCreatePermission && (
                        <Tooltip title={limitReached ? limitMessage : undefined}>
                            {/* Keep the limit tooltip reachable by keyboard when its button is disabled. */}
                            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
                            <span className="shrink-0 inline-flex" tabIndex={limitReached ? 0 : undefined}>
                                <Button
                                    color="norm"
                                    className="inline-flex items-center gap-2"
                                    onClick={() => openAccountModal({})}
                                    disabled={!canCreate}
                                >
                                    <IcPlus />
                                    {c('Action').t`Add service account`}
                                </Button>
                            </span>
                        </Tooltip>
                    )}
                </div>
            )}
            {permissions.showUnlockOrgKeyWarning && (
                <Banner variant="warning" className="mb-4">{c('Info')
                    .t`Unlock your organization key to create service accounts and assign managers.`}</Banner>
            )}
            {permissions.showMissingDomainWarning && (
                <Banner
                    variant="info"
                    className="mb-4"
                    action={<ButtonLike as={SettingsLink} path="/domain-names">{c('Action').t`Add domain`}</ButtonLike>}
                >{c('Info').t`Set up a custom domain to use service accounts`}</Banner>
            )}
            {permissions.tokenCreationDisabled && permissions.hasCreatePermission && (
                <Banner variant="info" className="mb-4">{c('Info')
                    .t`Your organization has disabled personal access token creation. Enable it before adding service accounts.`}</Banner>
            )}
            {error && (
                <Banner
                    variant="danger"
                    className="mb-4"
                    action={<Button onClick={refresh}>{c('Action').t`Retry`}</Button>}
                >{c('Error').t`Service accounts could not be loaded.`}</Banner>
            )}
            {showList && (
                <Table
                    hasActions
                    responsive="cards"
                    className="service-accounts-table"
                    data-testid="service-accounts-table"
                >
                    <thead>
                        <tr className="bg-weak">
                            <TableHeaderCell>{c('Table header').t`Service name`}</TableHeaderCell>
                            <TableHeaderCell>
                                {c('Table header').t`Status`}{' '}
                                <Info
                                    title={c('Info')
                                        .t`Active service accounts have a valid access token. Service accounts without a token or manager are marked accordingly.`}
                                />
                            </TableHeaderCell>
                            <TableHeaderCell>{c('Table header').t`Managers`}</TableHeaderCell>
                            <TableHeaderCell>
                                <span className="sr-only">{c('Table header').t`Actions`}</span>
                            </TableHeaderCell>
                        </tr>
                    </thead>
                    <TableBody loading={loading} colSpan={4}>
                        {visibleAccounts.map((account) => {
                            const labels = managerNames[account.MemberID] || [];
                            const count = account.Managers.length;
                            let managersLabel = c('Label').ngettext(
                                msgid`${count} manager`,
                                `${count} managers`,
                                count
                            );
                            if (!count) {
                                managersLabel = c('Label').t`No manager`;
                            } else if (labels.length === count) {
                                managersLabel = `${labels.slice(0, 3).join(', ')}${count > 3 ? `, +${count - 3}` : ''}`;
                            }
                            const disabled = account.State === ServiceAccountState.Disabled;
                            const actions = [
                                canEdit && {
                                    key: 'edit',
                                    text: (
                                        <span className="inline-flex items-center gap-2">
                                            <IcPen />
                                            {c('Action').t`Edit`}
                                        </span>
                                    ),
                                    onClick: () => openAccountModal({ account }),
                                },
                                canUpdate && {
                                    key: 'enable',
                                    text: (
                                        <span className="inline-flex items-center gap-2">
                                            {disabled ? <IcCheckmarkCircle /> : <IcCircleSlash />}
                                            {disabled ? c('Action').t`Enable` : c('Action').t`Disable`}
                                        </span>
                                    ),
                                    onClick: () =>
                                        openConfirmModal({ account, action: disabled ? 'enable' : 'disable' }),
                                },
                                canDelete && {
                                    key: 'delete',
                                    actionType: 'delete' as const,
                                    text: (
                                        <span className="inline-flex items-center gap-2">
                                            <IcTrash />
                                            {c('Action').t`Delete`}
                                        </span>
                                    ),
                                    onClick: () => openConfirmModal({ account, action: 'delete' }),
                                },
                            ].filter(isTruthy);
                            return (
                                <TableRow key={account.MemberID}>
                                    <TableCell label={c('Table header').t`Service name`}>
                                        <Button
                                            shape="underline"
                                            className="text-left text-ellipsis max-w-full"
                                            disabled={!canEdit}
                                            onClick={() => openAccountModal({ account })}
                                        >
                                            {account.Name}
                                        </Button>
                                    </TableCell>
                                    <TableCell>
                                        <ServiceAccountStatus account={account} />
                                    </TableCell>
                                    <TableCell>
                                        <span className={!count ? 'color-weak' : undefined} title={labels.join(', ')}>
                                            {managersLabel}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right simple-table__action-cell">
                                        {!!actions.length && (
                                            <DropdownActionsIcon
                                                shape="ghost"
                                                size="small"
                                                iconElement={
                                                    <IcThreeDotsVertical alt={c('Title').t`Open actions dropdown`} />
                                                }
                                                list={actions}
                                            />
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {listedBeforeCreation && (
                            <TableRow aria-busy="true">
                                <TableCell label={c('Table header').t`Service name`}>
                                    <span className="sr-only">{c('Info').t`Adding service account`}</span>
                                    <SkeletonLoader width="8em" />
                                </TableCell>
                                <TableCell>
                                    <SkeletonLoader width="6em" />
                                </TableCell>
                                <TableCell>
                                    <SkeletonLoader width="7em" />
                                </TableCell>
                                <TableCell>{null}</TableCell>
                            </TableRow>
                        )}
                        {!visibleAccounts.length && !listedBeforeCreation && (
                            <TableRow>
                                <TableCell colSpan={4} className="color-weak py-8">
                                    <p className="m-0 text-center">
                                        {accounts.length
                                            ? c('Info').t`No service accounts match your search.`
                                            : c('Info')
                                                  .t`No service accounts yet. Add one to automate ${BRAND_NAME} services.`}
                                    </p>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            )}
            {renderAccountModal &&
                accountModal &&
                (accountModal.account ? (
                    <EditServiceAccountModal
                        {...formProps}
                        account={accountModal.account}
                        canEditName={canUpdate}
                        onSave={save}
                    />
                ) : (
                    <CreateServiceAccountModal {...formProps} checkEmail={checkEmail} onCreate={createAccount} />
                ))}
            {renderConfirmModal && confirmation && (
                <ServiceAccountConfirmPrompt
                    {...confirmModalProps}
                    {...confirmation}
                    onConfirm={() =>
                        confirmation.action === 'delete'
                            ? remove(confirmation.account)
                            : setEnabled(confirmation.account, confirmation.action === 'enable')
                    }
                />
            )}
        </SettingsSectionWide>
    );
};

export default ServiceAccountsSection;
