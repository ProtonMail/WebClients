import { type FC, useEffect, useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import type { ApiImporterOrganizationUser } from '@proton/activation/src/api/api.interface';
import { ProductStatusState } from '@proton/activation/src/api/api.interface';
import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Checkbox from '@proton/components/components/input/Checkbox';
import SearchInput from '@proton/components/components/input/SearchInput';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableHeaderCell from '@proton/components/components/table/TableHeaderCell';
import TableRow from '@proton/components/components/table/TableRow';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { IcUserArrowRight } from '@proton/icons/icons/IcUserArrowRight';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { normalize } from '@proton/shared/lib/helpers/string';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import type { CreateMigrationBatchError } from '../../thunk';
import ActivationStatus from './ActivationStatus';
import ImportStatus, { coalesceStatus } from './ImportStatus';

import './ProviderUsersTable.scss';

export enum ProviderUserColumn {
    User = 1 << 0,
    Size = 1 << 1,
    Activation = 1 << 2,
    Migration = 1 << 3,
}

export enum ProviderUserFilter {
    ALL = 1 << 0,
    NOT_STARTED = 1 << 1,
    IN_PROGRESS = 1 << 2,
    COMPLETED = 1 << 3,
    ERROR = 1 << 4,
    ACTIVATED = 1 << 5,
    NOT_ACTIVATED = 1 << 6,
}

type Props = {
    users: ApiImporterOrganizationUser[];
    currentUser: string | undefined;
    selected?: string[];
    setSelected?: (users: string[]) => void;
    selectable?: string[];
    disabled?: boolean;
    disabledReason?: string;
    onMigrate?: () => Promise<void>;
    onViewReport?: (user: ApiImporterOrganizationUser) => (() => void) | undefined;
    hiddenColumns?: ProviderUserColumn;
    hiddenFilters?: ProviderUserFilter;
    transferErrors?: CreateMigrationBatchError[];
};

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
        case ProviderUserFilter.ACTIVATED:
            return c('BOSS').t`Activated`;
        case ProviderUserFilter.NOT_ACTIVATED:
            return c('BOSS').t`Not activated`;
    }
};

const ProviderUsersTable: FC<Props> = ({
    users,
    currentUser,
    selected = [],
    setSelected,
    selectable = [],
    disabled = false,
    disabledReason,
    onMigrate,
    onViewReport = noop,
    hiddenColumns = 0,
    hiddenFilters = 0,
    transferErrors,
}) => {
    const [keywords, setKeywords] = useState('');
    const [filter, setFilter] = useState<ProviderUserFilter>(ProviderUserFilter.ALL);

    const providerFilters: Record<ProviderUserFilter, (user: ApiImporterOrganizationUser) => boolean> = {
        [ProviderUserFilter.ALL]: () => true,
        [ProviderUserFilter.NOT_STARTED]: (user) => coalesceStatus(user, transferErrors) === undefined,
        [ProviderUserFilter.IN_PROGRESS]: (user) => coalesceStatus(user) === ProductStatusState.Active,
        [ProviderUserFilter.COMPLETED]: (user) => coalesceStatus(user) === ProductStatusState.Completed,
        [ProviderUserFilter.ERROR]: (user) => coalesceStatus(user, transferErrors) === ProductStatusState.Error,
        [ProviderUserFilter.ACTIVATED]: (user) => user.ImporterOrganizationUser?.HasTemporaryPassword === false,
        [ProviderUserFilter.NOT_ACTIVATED]: (user) => user.ImporterOrganizationUser?.HasTemporaryPassword !== false,
    };

    const filteredSearchProviderUsers = useMemo(() => {
        const filteredProviderUsers = users.filter(providerFilters[filter]);

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
    }, [keywords, filter, users]);

    const filteredSelectable = selectable.filter((id) => filteredSearchProviderUsers.some((u) => u.ID === id));

    const total = filteredSearchProviderUsers.length;

    const allChecked = filteredSelectable.length > 0 && selected.length === filteredSelectable.length;

    const handleSelectAll = () => {
        const nextValue = allChecked ? [] : filteredSelectable;
        setSelected?.(nextValue);
    };

    const handleSelectSingle = (userId: string) => () => {
        const nextValue = selected.includes(userId) ? selected.filter((id) => id !== userId) : [...selected, userId];
        setSelected?.(nextValue);
    };

    useEffect(() => {
        setSelected?.([]);
    }, [filter]);

    return (
        <section aria-labelledby="migrate-users">
            <h3 className="sr-only" id="migrate-users">{c('BOSS').t`Select users to migrate`}</h3>
            <div className="px-6 py-4 sm:flex sm:flex-row flex-nowrap items-center gap-2 w-full border-bottom border-weak">
                {/* Users filter */}
                <div className="flex-1 flex gap-2">
                    {Object.values(ProviderUserFilter)
                        .filter((x) => typeof x === 'number')
                        .filter((x) => (hiddenFilters & x) !== x)
                        .map((x) => (
                            <Button
                                pill
                                className={clsx(
                                    'flex gap-3',
                                    filter !== x && 'bg-weak',
                                    filter === x && 'text-semibold'
                                )}
                                shape={filter === x ? 'outline' : 'solid'}
                                color={filter === x ? 'success' : 'weak'}
                                onClick={() => setFilter(x)}
                                key={x}
                            >
                                <span>{getFilterTranslation(x)}</span>
                                <span>{users.filter(providerFilters[x]).length}</span>
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
                {onMigrate && (
                    <Tooltip title={disabledReason} openDelay={0}>
                        <div className="inline-block">
                            <Button
                                color="norm"
                                onClick={onMigrate}
                                disabled={disabled}
                                className="flex flex-nowrap items-center gap-2 shrink-0 text-semibold"
                            >
                                <IcUserArrowRight />
                                {c('BOSS').t`Migrate`}
                            </Button>
                        </div>
                    </Tooltip>
                )}
            </div>
            <Table borderWeak responsive="stacked" className="mb-0 provider-users-table">
                <TableHeader>
                    <TableRow>
                        <TableHeaderCell className="w-full provider-users-table-cell pr-0">
                            <div className="pl-4 py-4 pl-2 flex items-center flex-nowrap">
                                {setSelected && (
                                    <Checkbox
                                        className="mr-4 shrink-0"
                                        id="select-all"
                                        onChange={handleSelectAll}
                                        checked={allChecked}
                                        indeterminate={!allChecked && selected.length > 0}
                                        disabled={!filteredSelectable.length || total === 0}
                                    />
                                )}
                                <label htmlFor="select-all" className="m-0 flex-1">{c('BOSS').t`User`}</label>
                            </div>
                        </TableHeaderCell>
                        <TableHeaderCell className="w-custom" style={{ '--w-custom': 'max(9rem, 12vw)' }}>
                            <span className="text-ellipsis" title={c('BOSS').t`Estimated size`}>{c('BOSS')
                                .t`Estimated size`}</span>
                        </TableHeaderCell>
                        {(hiddenColumns & ProviderUserColumn.Migration) !== ProviderUserColumn.Migration && (
                            <TableHeaderCell className="w-custom" style={{ '--w-custom': 'max(11rem, 13vw)' }}>
                                <div className="flex">
                                    <Tooltip
                                        openDelay={0}
                                        title={c('BOSS')
                                            .t`Data migration status from Google Workspace to ${BRAND_NAME}`}
                                    >
                                        <div className="flex items-center flex-nowrap gap-2">
                                            <IcInfoCircle className="shrink-0" />
                                            <span className="text-ellipsis">{c('BOSS').t`Migration status`}</span>
                                        </div>
                                    </Tooltip>
                                </div>
                            </TableHeaderCell>
                        )}
                        {(hiddenColumns & ProviderUserColumn.Activation) !== ProviderUserColumn.Activation && (
                            <TableHeaderCell className="w-custom" style={{ '--w-custom': 'max(7rem, 11vw)' }}>
                                <div className="flex">
                                    <Tooltip
                                        openDelay={0}
                                        title={c('BOSS').t`Users who have accessed their ${BRAND_NAME} account`}
                                    >
                                        <div className="flex items-center flex-nowrap gap-2">
                                            <IcInfoCircle className="shrink-0" />
                                            <span className="text-ellipsis">{c('BOSS').t`Activated`}</span>
                                        </div>
                                    </Tooltip>
                                </div>
                            </TableHeaderCell>
                        )}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredSearchProviderUsers.map((u, index) => (
                        <TableRow key={u.ID}>
                            <TableCell className="provider-users-table-cell pr-0">
                                <div className="flex flex-nowrap items-center py-2 relative pl-4 provider-users-table-cell-check-users">
                                    {setSelected && (
                                        <Checkbox
                                            className="mr-4 shrink-0"
                                            id={`select-user-${index}`}
                                            checked={selected.includes(u.ID) || Boolean(u.ImporterOrganizationUser)}
                                            onChange={handleSelectSingle(u.ID)}
                                            disabled={Boolean(u.ImporterOrganizationUser)}
                                        />
                                    )}
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
                            <TableCell label={c('BOSS').t`Size`} className="provider-users-table-cell color-weak">
                                {humanSize({ bytes: u.UsedQuota, fraction: 0 })}
                            </TableCell>
                            {(hiddenColumns & ProviderUserColumn.Migration) !== ProviderUserColumn.Migration && (
                                <TableCell label={c('BOSS').t`Status`} className="provider-users-table-cell color-weak">
                                    <ImportStatus
                                        status={coalesceStatus(u, transferErrors)}
                                        onClick={onViewReport(u)}
                                    />
                                </TableCell>
                            )}
                            {(hiddenColumns & ProviderUserColumn.Activation) !== ProviderUserColumn.Activation && (
                                <TableCell
                                    label={c('BOSS').t`Activated`}
                                    className="provider-users-table-cell color-weak"
                                >
                                    <ActivationStatus
                                        isActivated={
                                            u.Email === currentUser ||
                                            u.ImporterOrganizationUser?.HasTemporaryPassword === false
                                        }
                                    />
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                    {total === 0 && (
                        <TableRow>
                            <TableCell colSpan={4}>
                                <div className="p-4 text-center color-weak">{c('BOSS').t`No users to display`}</div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </section>
    );
};

export default ProviderUsersTable;
