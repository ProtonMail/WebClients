import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { isOwnerRole } from '@proton/account/organizationRoles/helpers';
import { useUser } from '@proton/account/user/hooks';
import { useUserPermissions } from '@proton/account/userPermissions/hooks';
import type { ButtonProps } from '@proton/atoms/Button/Button';
import { Button } from '@proton/atoms/Button/Button';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import {
    DropdownActions,
    IllustrationPlaceholder,
    Loader,
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
    useModalStateWithData,
    useNotifications,
    usePagination,
} from '@proton/components';
import SettingsPageTitle from '@proton/components/containers/account/SettingsPageTitle';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionExtraWide from '@proton/components/containers/account/SettingsSectionExtraWide';
import { IcArrowOutSquare } from '@proton/icons/icons/IcArrowOutSquare';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import emptyCompaniesImg from '@proton/styles/assets/img/illustrations/empty-companies.svg';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import useMspCompanies from '../hooks/useMspCompanies';
import type { CompanyFormData, MspCompany } from '../types';
import CompanyModal from './CompanyModal';
import DisableCompanyModal from './DisableCompanyModal';
import { MspLoginModal } from './MspLoginModal';

import './MspCompaniesSection.scss';

type ModalState = { mode: 'add' } | { mode: 'edit'; company: MspCompany } | null;

const PAGE_SIZE = 15;

const ManageButton = ({ className, ...props }: { className?: string } & ButtonProps) => (
    <Button shape="outline" color="weak" className={clsx('flex-nowrap items-center gap-1', className)} {...props}>
        <span>{c('Action').t`Manage`}</span>
        <IcArrowOutSquare className="shrink-0" />
    </Button>
);

const MspCompaniesSection = ({ path }: { path: string }) => {
    const [user] = useUser();
    const isAdminRoleMVPEnabled = useFlag('AdminRoleMVP');
    const [userPermissions] = useUserPermissions();
    const isAdmin = isAdminRoleMVPEnabled ? (userPermissions?.Roles?.some(isOwnerRole) ?? false) : user.isAdmin;
    const { createNotification } = useNotifications();
    const handleError = useErrorHandler();
    const { companies, loading, addCompany, updateCompany, setCompanyStatus, manageCompany } = useMspCompanies();
    const { viewportWidth } = useActiveBreakpoint();

    const [search, setSearch] = useState('');
    const [modal, setModal] = useState<ModalState>(null);
    const [confirmDisable, setConfirmDisable] = useState<MspCompany | null>(null);
    const [{ data: manageAccountModalData, ...manageAccountModalProps }, openManageAccountModal, renderManageAccount] =
        useModalStateWithData<{
            linkUrl: string;
        }>();

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
                await updateCompany(modal.company.id, data);
                createNotification({ text: c('Success').t`${data.name} updated`, type: 'success' });
            } else {
                await addCompany(data);
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
            await setCompanyStatus(confirmDisable.id, 'disabled');
            createNotification({ text: c('Success').t`${confirmDisable.name} disabled`, type: 'success' });
            setConfirmDisable(null);
        } catch (e) {
            handleError(e);
        }
    };

    const handleEnable = async (company: MspCompany) => {
        try {
            await setCompanyStatus(company.id, 'active');
            createNotification({ text: c('Success').t`${company.name} enabled`, type: 'success' });
        } catch (e) {
            handleError(e);
        }
    };

    const handleManageCompany = async (company: MspCompany) => {
        try {
            const result = await manageCompany(company.id);
            openManageAccountModal({ linkUrl: getAppHref(path, APPS.PROTONACCOUNT, result.localID) });
        } catch (e) {
            handleError(e);
        }
    };

    if (loading) {
        return <Loader />;
    }

    return (
        <SettingsSectionExtraWide>
            <SettingsPageTitle className="mt-14">{c('Title').t`Companies`}</SettingsPageTitle>
            <SettingsParagraph className="mb-12">
                {isAdmin
                    ? c('Info')
                          .t`With managed companies, you can add, edit, and remove access for organizations you oversee.`
                    : c('Info').t`Companies you've been given access to manage.`}
            </SettingsParagraph>
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
                                    .t`Used / assigned seats`}</TableHeaderCell>
                                <TableHeaderCell className="msp-col-narrow text-ellipsis">{c('Column header')
                                    .t`Status`}</TableHeaderCell>
                                <TableHeaderCell className="msp-col-narrow" />
                            </tr>
                        </TableHeader>
                        <TableBody>
                            {pageCompanies.map((company) => {
                                const isDisabled = company.status === 'disabled';
                                const menuActions = [
                                    {
                                        key: 'edit',
                                        text: c('Action').t`Edit`,
                                        onClick: () => setModal({ mode: 'edit', company }),
                                    },
                                    {
                                        key: 'toggle-status',
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
                                            {isAdmin ? (
                                                <InlineLinkButton
                                                    className="block w-full overflow-hidden text-ellipsis text-nowrap color-norm text-underline text-left"
                                                    onClick={() => setModal({ mode: 'edit', company })}
                                                >
                                                    {company.name}
                                                </InlineLinkButton>
                                            ) : (
                                                <span className="block w-full overflow-hidden text-ellipsis text-nowrap">
                                                    {company.name}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell label={c('Column header').t`Used / assigned seats`}>
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
                                        <TableCell className="md:hidden">
                                            <ManageButton
                                                className="inline-flex gap-1 justify-center md:hidden"
                                                fullWidth
                                                onClick={() => handleManageCompany(company)}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right action-cell">
                                            <div className="inline-flex flex-nowrap gap-2">
                                                <ManageButton
                                                    size="small"
                                                    className="md:inline-flex gap-1 hidden"
                                                    onClick={() => handleManageCompany(company)}
                                                />
                                                <DropdownActions
                                                    size="small"
                                                    shape="ghost"
                                                    iconName="three-dots-vertical"
                                                    disabled={!isAdmin}
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

            {renderManageAccount && manageAccountModalData && (
                <MspLoginModal {...manageAccountModalProps} linkUrl={manageAccountModalData.linkUrl} />
            )}
        </SettingsSectionExtraWide>
    );
};

export default MspCompaniesSection;
