import { type FC, type ReactNode, useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import { type ApiImporterOrganizationUser, ProductStatusState } from '@proton/activation/src/api/api.interface';
import { Button } from '@proton/atoms/Button/Button';
import { Card } from '@proton/atoms/Card/Card';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Checkbox from '@proton/components/components/input/Checkbox';
import SearchInput from '@proton/components/components/input/SearchInput';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableHeaderCell from '@proton/components/components/table/TableHeaderCell';
import TableRow from '@proton/components/components/table/TableRow';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { normalize } from '@proton/shared/lib/helpers/string';
import clsx from '@proton/utils/clsx';

import type { CreateMigrationBatchError } from '../../thunk';
import ActivationStatus from './ActivationStatus';
import ImportStatus, { type UserWithExtendedErrors, coalesceStatus } from './ImportStatus';

import './ProviderUsersTable.scss';

type Props = {
    users: ApiImporterOrganizationUser[];
    transferErrors: CreateMigrationBatchError[];
    banners: ReactNode[];
    currentUser: string | undefined;
    selected: string[];
    setSelected: (users: string[]) => void;
    selectable: string[];
    disabled: boolean;
    disabledReason?: string;
    onMigrate: () => Promise<void>;
    activationLinkVisible: boolean;
};

enum ProviderUserFilter {
    ALL = 'all',
    NOT_STARTED = 'not-started',
    IN_PROGRESS = 'in-progress',
    COMPLETED = 'completed',
    ERROR = 'error',
}

const getFilterTranslation = (filter: ProviderUserFilter) => {
    switch (filter) {
        case ProviderUserFilter.ALL:
            return c('BOSS').t`All`;
        case ProviderUserFilter.NOT_STARTED:
            return c('BOSS').t`Pending`;
        case ProviderUserFilter.IN_PROGRESS:
            return c('BOSS').t`In progress`;
        case ProviderUserFilter.COMPLETED:
            return c('BOSS').t`Migrated`;
        case ProviderUserFilter.ERROR:
            return c('BOSS').t`Errors`;
    }
};

const providerFilters: Record<ProviderUserFilter, (user: UserWithExtendedErrors) => boolean> = {
    [ProviderUserFilter.ALL]: () => true,
    [ProviderUserFilter.NOT_STARTED]: (user) => !user.ImporterOrganizationUser,
    [ProviderUserFilter.IN_PROGRESS]: (user) =>
        coalesceStatus(user.ImporterOrganizationUser?.ProductStatuses) === ProductStatusState.Active,
    [ProviderUserFilter.COMPLETED]: (user) =>
        coalesceStatus(user.ImporterOrganizationUser?.ProductStatuses) === ProductStatusState.Completed,
    [ProviderUserFilter.ERROR]: (user) =>
        user.transferErrors.length > 0 ||
        coalesceStatus(user.ImporterOrganizationUser?.ProductStatuses) === ProductStatusState.Error,
};

const ProviderUsersTable: FC<Props> = ({
    users,
    transferErrors,
    banners,
    currentUser,
    selected,
    setSelected,
    selectable,
    disabled,
    disabledReason,
    onMigrate,
    activationLinkVisible,
}) => {
    const [keywords, setKeywords] = useState('');

    const [filter, setFilter] = useState<ProviderUserFilter>(ProviderUserFilter.ALL);

    const allChecked = selectable.length > 0 && selected.length === selectable.length;

    const usersWithExtendedErrors: UserWithExtendedErrors[] = users.map((user) => ({
        ...user,
        transferErrors: transferErrors.filter(({ metadata }) => metadata.user.ID === user.ID),
    }));

    const filteredProviderUsers = usersWithExtendedErrors.filter(providerFilters[filter]);

    const filteredSearchProviderUsers = useMemo(() => {
        if (!filteredProviderUsers) {
            return [];
        }
        if (!keywords) {
            return filteredProviderUsers;
        }

        const normalizedWords = normalize(keywords, true);

        return filteredProviderUsers.filter((user) => {
            return (
                normalize(user.AdminSetName, true).includes(normalizedWords) ||
                normalize(user.Email, true).includes(normalizedWords)
            );
        });
    }, [keywords, filteredProviderUsers]);

    const total = filteredSearchProviderUsers.length;

    const handleSelectAll = () => {
        const nextValue = allChecked ? [] : selectable;
        setSelected(nextValue);
    };

    const handleSelectSingle = (userId: string) => () => {
        const nextValue = selected.includes(userId) ? selected.filter((id) => id !== userId) : [...selected, userId];
        setSelected(nextValue);
    };

    return (
        <section className="pb-8 mb-12" aria-labelledby="migrate-users">
            <div className="flex justify-space-between items-center mb-4">
                <h3 className="text-xl text-semibold" id="migrate-users">{c('BOSS').t`Select users to migrate`}</h3>
            </div>
            <Card
                padded={false}
                rounded
                background={false}
                className="shadow-norm flex bg-elevated border-weak rounded-xl overflow-hidden"
            >
                <div className="px-6 py-4 sm:flex sm:flex-row flex-nowrap items-center gap-2 w-full border-bottom border-weak">
                    {/* Users filter */}
                    <div className="flex-1 flex gap-2">
                        {Object.values(ProviderUserFilter).map((x) => (
                            <Button
                                pill
                                className={clsx('flex gap-2 text-semibold border-none', filter !== x && 'bg-weak')}
                                color={filter === x ? 'norm' : 'weak'}
                                onClick={() => {
                                    if (x !== filter) {
                                        setSelected([]);
                                    }
                                    setFilter(x);
                                }}
                                key={x}
                            >
                                <span>{getFilterTranslation(x)}</span>
                                <span>{usersWithExtendedErrors.filter(providerFilters[x]).length}</span>
                            </Button>
                        ))}
                        <SearchInput
                            onChange={(value) => setKeywords(value)}
                            placeholder={c('Placeholder').t`Search`}
                            value={keywords}
                            aria-label={c('Placeholder').t`Search for users or addresses`}
                            className="border-none flex-1"
                        />
                        <span className="sr-only" aria-live="polite" aria-atomic="true">
                            {c('Info').ngettext(msgid`${total} user found`, `${total} users found`, total)}
                        </span>
                    </div>

                    {/* Migrate button */}
                    <Tooltip title={disabledReason} openDelay={0}>
                        <div className="inline-block">
                            <Button color="norm" onClick={onMigrate} disabled={disabled} className="shrink-0">
                                {c('BOSS').t`Start migrating`}
                            </Button>
                        </div>
                    </Tooltip>
                </div>
                {Boolean(banners?.length) && (
                    <div className="px-5 pt-2 flex flex-column flex-nowrap gap-2 w-full">{banners}</div>
                )}
                <Table borderWeak responsive="stacked" hasActions className="mb-0 provider-users-table">
                    <TableHeader>
                        <TableRow>
                            <TableHeaderCell className="w-1/2 provider-users-table-cell pr-0">
                                <div className="pl-4 py-4 pl-2 flex items-center flex-nowrap">
                                    <Checkbox
                                        className="mr-4 shrink-0"
                                        id="select-all"
                                        onChange={handleSelectAll}
                                        checked={allChecked}
                                        indeterminate={!allChecked && selected.length > 0}
                                        disabled={!selectable.length || total === 0}
                                    />
                                    <label htmlFor="select-all" className="m-0 flex-1">{c('BOSS').t`User`}</label>
                                </div>
                            </TableHeaderCell>
                            <TableHeaderCell className="w-custom text-right" style={{ '--w-custom': '9em' }}>
                                {c('BOSS').t`Estimated size`}
                            </TableHeaderCell>
                            <TableHeaderCell className="w-custom text-right" style={{ '--w-custom': '10em' }}>
                                {c('BOSS').t`User status`}
                            </TableHeaderCell>
                            <TableHeaderCell className="w-custom text-right" style={{ '--w-custom': '10em' }}>
                                <span className="block pr-4">{c('BOSS').t`Migration status`}</span>
                            </TableHeaderCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredSearchProviderUsers.map((u, index) => (
                            <TableRow key={u.ID}>
                                <TableCell className="provider-users-table-cell pr-0">
                                    <div className="flex flex-nowrap items-center py-2 relative pl-4 provider-users-table-cell-check-users">
                                        <Checkbox
                                            className="mr-4 shrink-0"
                                            id={`select-user-${index}`}
                                            checked={selected.includes(u.ID) || Boolean(u.ImporterOrganizationUser)}
                                            onChange={handleSelectSingle(u.ID)}
                                            disabled={Boolean(u.ImporterOrganizationUser)}
                                        />
                                        <label htmlFor={`select-user-${index}`} className="m-0">
                                            <p className="m-0 text-ellipsis" title={u.AdminSetName}>
                                                {u.AdminSetName}{' '}
                                                {u.Email === currentUser && (
                                                    <span className="ml-0.5">({c('BOSS').t`You`})</span>
                                                )}
                                            </p>
                                            <p className="m-0 text-sm color-hint text-ellipsis" title={u.Email}>
                                                {u.Email}
                                            </p>
                                        </label>
                                    </div>
                                </TableCell>
                                <TableCell
                                    label={c('BOSS').t`Size`}
                                    className="text-right text-left-when-stacked provider-users-table-cell color-weak"
                                >
                                    {humanSize({ bytes: u.UsedQuota, fraction: 0 })}
                                </TableCell>
                                <TableCell
                                    label={c('BOSS').t`Activated`}
                                    className="text-right text-left-when-stacked provider-users-table-cell color-weak"
                                >
                                    <ActivationStatus
                                        isActivated={
                                            u.Email === currentUser ||
                                            u.ImporterOrganizationUser?.HasTemporaryPassword === false
                                        }
                                        activationLinkVisible={activationLinkVisible}
                                    />
                                </TableCell>
                                <TableCell
                                    label={c('BOSS').t`Status`}
                                    className="text-right text-left-when-stacked provider-users-table-cell color-weak"
                                >
                                    <ImportStatus user={u} className="justify-start-when-stacked mr-4" />
                                </TableCell>
                            </TableRow>
                        ))}
                        {total === 0 && (
                            <TableRow>
                                <TableCell colSpan={4}>
                                    <div className="p-4 text-center">{c('BOSS').t`No users to display`}</div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>
        </section>
    );
};

export default ProviderUsersTable;
