import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { addCompanyThunk, setCompanyStatusThunk, updateCompanyThunk } from '@proton/account/mspSubsidiaries/actions';
import { useMspSubsidiaries } from '@proton/account/mspSubsidiaries/hooks';
import { manageCompanyAndOpenTabThunk } from '@proton/account/mspSubsidiaries/manageCompanyAction';
import { useMspDispatch } from '@proton/account/mspSubsidiaries/useMspDispatch';
import { isOwnerRole } from '@proton/account/organizationRoles/helpers';
import { useUser } from '@proton/account/user/hooks';
import { useUserOrganizations } from '@proton/account/userOrganizations/hooks';
import { useUserPermissions } from '@proton/account/userPermissions/hooks';
import type { ButtonProps } from '@proton/atoms/Button/Button';
import { Button } from '@proton/atoms/Button/Button';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import {
    DropdownActions,
    IllustrationPlaceholder,
    Loader,
    NotificationButton,
    Pagination,
    SearchInput,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableHeaderCell,
    TableRow,
    useActiveBreakpoint,
    useErrorHandler,
    useNotifications,
    usePagination,
} from '@proton/components';
import SettingsPageTitle from '@proton/components/containers/account/SettingsPageTitle';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionExtraWide from '@proton/components/containers/account/SettingsSectionExtraWide';
import { IcArrowOutSquare } from '@proton/icons/icons/IcArrowOutSquare';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import type { MspDelegatedManager } from '@proton/shared/lib/api/msp';
import { ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import { MEMBER_STATE } from '@proton/shared/lib/interfaces/Member';
import type { MspSubsidiary } from '@proton/shared/lib/interfaces/MspSubsidiary';
import type { UserOrganization } from '@proton/shared/lib/interfaces/Organization';
import emptyCompaniesImg from '@proton/styles/assets/img/illustrations/empty-companies.svg';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { UNAUTHENTICATED_ROUTES } from '../../../content/helper';
import type { CompanyFormData, MspCompany } from '../types';
import CompanyModal from './CompanyModal';
import DisableCompanyModal from './DisableCompanyModal';
import ManageManagersModal from './ManageManagersModal';

import './MspCompaniesSection.scss';

type ModalState = { mode: 'add' } | { mode: 'edit'; company: MspCompany } | null;

const PAGE_SIZE = 15;
const MANAGERS_COLLAPSE_THRESHOLD = 5;
const MANAGERS_VISIBLE_COUNT = 3;

const toCompany = (sub: MspSubsidiary): MspCompany => ({
    id: sub.ID,
    name: sub.Name,
    assignedSeats: sub.MaxMembers,
    usedSeats: sub.ActiveMembers,
    status: sub.Status,
    managers: sub.DelegatedManagers,
});

const toManagedCompany = (org: UserOrganization): MspCompany => ({
    id: org.OrganizationID,
    name: org.OrganizationName,
    assignedSeats: org.MaxMembers,
    usedSeats: org.UsedMembers,
    status: org.Status,
    // IT managers can't view co-managers of a company they manage — the backend only allows the
    // MSP owner (admin of the parent org) to list a subsidiary's delegated managers.
    managers: [],
});

const ManagersCell = ({ managers, onManage }: { managers: MspDelegatedManager[]; onManage: () => void }) => {
    const names = managers.map((manager) => manager.Name);

    if (names.length === 0) {
        return <InlineLinkButton onClick={onManage}>{c('Action').t`Assign manager(s)`}</InlineLinkButton>;
    }

    if (names.length <= MANAGERS_COLLAPSE_THRESHOLD) {
        return <InlineLinkButton onClick={onManage}>{names.join(', ')}</InlineLinkButton>;
    }

    const remaining = names.length - MANAGERS_VISIBLE_COUNT;
    return (
        <InlineLinkButton onClick={onManage}>
            {names.slice(0, MANAGERS_VISIBLE_COUNT).join(', ')}{' '}
            <span className="color-weak">{`+${remaining}`}</span>
        </InlineLinkButton>
    );
};

const ManageButton = ({ className, ...props }: { className?: string } & ButtonProps) => (
    <Button shape="outline" color="weak" className={clsx('flex-nowrap items-center gap-1', className)} {...props}>
        <span>{c('Action').t`Manage`}</span>
        <IcArrowOutSquare className="shrink-0" />
    </Button>
);

const MspCompaniesSection = ({ path }: { path: string }) => {
    const { createNotification } = useNotifications();
    const handleError = useErrorHandler();
    const dispatch = useMspDispatch();
    const [user] = useUser();

    const [subsidiaries = [], subsidiariesLoading] = useMspSubsidiaries();
    const [userOrganizations = [], userOrganizationsLoading] = useUserOrganizations();

    const isAdminRoleMVPEnabled = useFlag('AdminRoleMVP');
    const [userPermissions, userPermissionsLoading] = useUserPermissions();
    const isAdmin = isAdminRoleMVPEnabled ? (userPermissions?.Roles?.some(isOwnerRole) ?? false) : user.isAdmin;
    const companies = isAdmin
        ? subsidiaries.map(toCompany)
        : userOrganizations
              .filter((org) => !org.IsPrimary && org.MemberState === MEMBER_STATE.STATUS_ENABLED)
              .map(toManagedCompany);
    const loading = userPermissionsLoading || (isAdmin ? subsidiariesLoading : userOrganizationsLoading);
    const { viewportWidth } = useActiveBreakpoint();

    const [search, setSearch] = useState('');
    const [modal, setModal] = useState<ModalState>(null);
    const [confirmDisable, setConfirmDisable] = useState<MspCompany | null>(null);
    const [manageManagersCompany, setManageManagersCompany] = useState<MspCompany | null>(null);
    const [managingIds, setManagingIds] = useState<Set<string>>(new Set());

    const filtered = companies
        .filter((company) => company.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name));

    const {
        page,
        list: pageCompanies,
        onNext,
        onPrevious,
        onSelect,
    } = usePagination<MspCompany>(filtered, 1, PAGE_SIZE);

    // Reset to page 1 whenever the search query changes to avoid stale empty pages.
    useEffect(() => {
        onSelect(1);
    }, [search]);

    const handleSave = async (data: CompanyFormData) => {
        try {
            if (modal?.mode === 'edit') {
                await dispatch(updateCompanyThunk({ id: modal.company.id, data }));
                createNotification({ text: c('Success').t`${data.name} updated`, type: 'success' });
            } else {
                await dispatch(addCompanyThunk({ data }));
                createNotification({ text: c('Success').t`${data.name} added`, type: 'success' });
            }
            setModal(null);
        } catch (e) {
            handleError(e);
        }
    };

    const handleConfirmDisable = async () => {
        if (!confirmDisable) {
            return;
        }
        try {
            await dispatch(setCompanyStatusThunk({ id: confirmDisable.id, status: ORGANIZATION_STATE.DISABLED }));
            createNotification({ text: c('Success').t`${confirmDisable.name} disabled`, type: 'success' });
            setConfirmDisable(null);
        } catch (e) {
            handleError(e);
        }
    };

    const handleEnable = async (company: MspCompany) => {
        try {
            await dispatch(setCompanyStatusThunk({ id: company.id, status: ORGANIZATION_STATE.ACTIVE }));
            createNotification({ text: c('Success').t`${company.name} enabled`, type: 'success' });
        } catch (e) {
            handleError(e);
        }
    };

    const handleManageCompany = async (company: MspCompany) => {
        if (managingIds.has(company.id)) {
            return;
        }

        setManagingIds((prev) => new Set(prev).add(company.id));

        try {
            const result = await dispatch(
                manageCompanyAndOpenTabThunk({
                    id: company.id,
                    path,
                    loadingPath: UNAUTHENTICATED_ROUTES.MSP_SETTING_UP_ACCESS,
                })
            );

            if (result.type === 'blocked') {
                createNotification({
                    key: `msp-manage-${company.id}`,
                    type: 'warning',
                    expiration: -1,
                    text: (
                        <>
                            <span>{c('Info').t`Your browser blocked the new tab.`}</span>
                            <NotificationButton as="a" href={result.href} target="_blank" rel="noopener noreferrer">
                                {c('Action').t`Open ${company.name} manually`}
                            </NotificationButton>
                        </>
                    ),
                });
            }
        } catch (e) {
            handleError(e);
        } finally {
            setManagingIds((prev) => {
                const next = new Set(prev);
                next.delete(company.id);
                return next;
            });
        }
    };

    if (loading) {
        return <Loader />;
    }

    return (
        <SettingsSectionExtraWide>
            <SettingsPageTitle className="mt-14">{c('Title').t`Companies`}</SettingsPageTitle>
            <SettingsParagraph className="mb-12">{c('Info')
                .t`Manage the companies you're responsible for.`}</SettingsParagraph>
            <div className="mb-4 flex items-center justify-space-between">
                <div className="w-custom" style={{ '--w-custom': '20em' }}>
                    <SearchInput
                        value={search}
                        onChange={setSearch}
                        placeholder={c('Placeholder').t`Search for a company`}
                    />
                </div>
                {isAdmin && (
                    <Button
                        color="norm"
                        onClick={() => setModal({ mode: 'add' })}
                        className="inline-flex flex-nowrap items-center gap-1"
                        icon={viewportWidth['<=small']}
                    >
                        {viewportWidth['<=small'] ? (
                            <IcPlus className="icon-size-4 shrink-0" />
                        ) : (
                            <span>{c('Action').t`Add company`}</span>
                        )}
                    </Button>
                )}
            </div>

            {companies.length === 0 ? (
                <div className="flex items-center justify-center">
                    <IllustrationPlaceholder url={emptyCompaniesImg}>
                        <p className="m-0 text-sm color-hint text-center">
                            {isAdmin
                                ? c('Info').t`No companies yet. Start by creating a new company.`
                                : c('Info').t`You don't manage any companies yet.`}
                        </p>
                    </IllustrationPlaceholder>
                </div>
            ) : (
                <>
                    <Table hasActions borderWeak responsive="cards" className="msp-companies-table">
                        <TableHeader className="msp-table-header">
                            <tr>
                                <TableHeaderCell className="text-ellipsis">{c('Column header')
                                    .t`Company`}</TableHeaderCell>
                                <TableHeaderCell className="text-ellipsis">{c('Column header')
                                    .t`Used / allocated licenses`}</TableHeaderCell>
                                <TableHeaderCell className="msp-col-narrow text-ellipsis">{c('Column header')
                                    .t`Status`}</TableHeaderCell>
                                {isAdmin && (
                                    <TableHeaderCell className="text-ellipsis">{c('Column header')
                                        .t`Managers`}</TableHeaderCell>
                                )}
                                <TableHeaderCell className="msp-col-narrow" />
                            </tr>
                        </TableHeader>
                        <TableBody>
                            {pageCompanies.map((company) => {
                                const isDisabled = company.status === ORGANIZATION_STATE.DISABLED;
                                const isActive = company.status === ORGANIZATION_STATE.ACTIVE;
                                const menuActions = [
                                    {
                                        key: 'edit',
                                        text: c('Action').t`Edit`,
                                        onClick: () => setModal({ mode: 'edit', company }),
                                    },
                                    {
                                        key: 'toggle-status',
                                        disabled: !isAdmin,
                                        text: isDisabled
                                            ? c('Action').t`Enable company`
                                            : c('Action').t`Disable company`,
                                        onClick: () =>
                                            isDisabled ? handleEnable(company) : setConfirmDisable(company),
                                    },
                                ];

                                return (
                                    <TableRow key={company.id}>
                                        <TableCell label={c('Column header').t`Company`}>
                                            <InlineLinkButton
                                                className="block w-full overflow-hidden text-ellipsis text-nowrap color-norm text-underline text-left"
                                                onClick={() => setModal({ mode: 'edit', company })}
                                            >
                                                {company.name}
                                            </InlineLinkButton>
                                        </TableCell>
                                        <TableCell label={c('Column header').t`Used / allocated licenses`}>
                                            <span className={clsx(isDisabled && 'color-weak')}>
                                                {company.usedSeats}/{company.assignedSeats}
                                            </span>
                                        </TableCell>
                                        <TableCell label={c('Column header').t`Status`}>
                                            <span
                                                className={clsx(
                                                    'msp-status-pill inline-flex items-center justify-center rounded-sm text-uppercase text-normal color-weak',
                                                    isDisabled ? 'msp-status-pill--disabled' : 'msp-status-pill--active'
                                                )}
                                            >
                                                <span>
                                                    {isDisabled ? c('Status').t`Disabled` : c('Status').t`Active`}
                                                </span>
                                            </span>
                                        </TableCell>
                                        {isAdmin && (
                                            <TableCell label={c('Column header').t`Managers`}>
                                                <ManagersCell
                                                    managers={company.managers}
                                                    onManage={() => setManageManagersCompany(company)}
                                                />
                                            </TableCell>
                                        )}
                                        <TableCell className="md:hidden">
                                            <ManageButton
                                                className="inline-flex gap-1 justify-center md:hidden"
                                                fullWidth
                                                disabled={!isActive}
                                                loading={managingIds.has(company.id)}
                                                onClick={() => handleManageCompany(company)}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right action-cell">
                                            <div className="inline-flex flex-nowrap gap-2">
                                                <ManageButton
                                                    size="small"
                                                    className="md:inline-flex gap-1 hidden"
                                                    disabled={!isActive}
                                                    loading={managingIds.has(company.id)}
                                                    onClick={() => handleManageCompany(company)}
                                                />
                                                <DropdownActions
                                                    size="small"
                                                    shape="ghost"
                                                    iconName="three-dots-vertical"
                                                    list={menuActions}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>

                    {filtered.length > PAGE_SIZE && (
                        <div className="flex justify-center mt-4">
                            <Pagination
                                total={filtered.length}
                                limit={PAGE_SIZE}
                                page={page}
                                onNext={onNext}
                                onPrevious={onPrevious}
                                onSelect={onSelect}
                            />
                        </div>
                    )}
                </>
            )}

            {modal && (
                <CompanyModal
                    mode={modal.mode}
                    initial={modal.mode === 'edit' ? modal.company : undefined}
                    onSave={handleSave}
                    onClose={() => setModal(null)}
                />
            )}

            {confirmDisable && (
                <DisableCompanyModal onConfirm={handleConfirmDisable} onClose={() => setConfirmDisable(null)} />
            )}

            {manageManagersCompany && (
                <ManageManagersModal company={manageManagersCompany} onClose={() => setManageManagersCompany(null)} />
            )}
        </SettingsSectionExtraWide>
    );
};

export default MspCompaniesSection;
