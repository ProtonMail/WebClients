import type { FC } from 'react';

import { c } from 'ttag';

import type { ApiImporterOrganizationUser } from '@proton/activation/src/api/api.interface';
import { Checkbox, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@proton/components';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import './ProviderUsersTable.scss';

type Props = {
    users: ApiImporterOrganizationUser[];
    selected: string[];
    setSelected: (users: string[]) => void;
};

const ProviderUsersTable: FC<Props> = ({ users, selected, setSelected }) => {
    const allChecked = selected.length > 0 && selected.length === users.length;

    const handleSelectAll = () => {
        const nextValue = allChecked ? [] : users.map((u) => u.ID);
        setSelected(nextValue);
    };

    const handleSelectSingle = (userId: string) => () => {
        const nextValue = selected.includes(userId) ? selected.filter((id) => id !== userId) : [...selected, userId];

        setSelected(nextValue);
    };

    return (
        <Table borderWeak responsive="stacked" hasActions className="mb-0 provider-users-table">
            <TableHeader>
                <TableRow>
                    <TableHeaderCell className="w-1/2">
                        <div className="p-4 flex items-center flex-nowrap">
                            <Checkbox
                                className="mr-4 shrink-0"
                                id="select-all"
                                onChange={handleSelectAll}
                                checked={allChecked}
                                indeterminate={!allChecked && selected.length > 0}
                            />
                            <label htmlFor="select-all" className="m-0 flex-1">{c('BOSS').t`User`}</label>
                        </div>
                    </TableHeaderCell>
                    <TableHeaderCell className="text-right">
                        <span className="pr-4">{c('BOSS').t`Estimated size`}</span>
                    </TableHeaderCell>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((u, index) => (
                    <TableRow key={u.ID}>
                        <TableCell className="provider-users-table-cell">
                            <div className="flex flex-nowrap items-center py-2 relative px-4 provider-users-table-cell-check-users">
                                <Checkbox
                                    className="mr-4"
                                    id={`select-user-${index}`}
                                    checked={selected.includes(u.ID)}
                                    onChange={handleSelectSingle(u.ID)}
                                />
                                <label htmlFor={`select-user-${index}`} className="m-0">
                                    <p className="m-0 text-ellipsis" title={u.AdminSetName}>
                                        {u.AdminSetName}
                                    </p>
                                    <p className="m-0 text-sm color-hint text-ellipsis" title={u.Email}>
                                        {u.Email}
                                    </p>
                                </label>
                            </div>
                        </TableCell>
                        <TableCell className="text-right pr-4 text-left-when-stacked provider-users-table-cell">
                            <span className="pr-4">{humanSize({ bytes: u.UsedQuota, fraction: 0 })}</span>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export default ProviderUsersTable;
