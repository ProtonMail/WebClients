import type { FC } from 'react';

import { c } from 'ttag';

import type { ApiImporterOrganizationUser } from '@proton/activation/src/api/api.interface';
import { Checkbox, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@proton/components';
import humanSize from '@proton/shared/lib/helpers/humanSize';

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
        <Table borderWeak responsive="stacked">
            <TableHeader>
                <TableRow>
                    <TableHeaderCell>
                        <Checkbox
                            className="mr-2"
                            onChange={handleSelectAll}
                            checked={allChecked}
                            indeterminate={!allChecked && selected.length > 0}
                        />
                        {c('BOSS').t`User`}
                    </TableHeaderCell>
                    <TableHeaderCell className="w-custom" style={{ '--w-custom': '10em' }}>{c('BOSS')
                        .t`Estimated size`}</TableHeaderCell>
                    <TableHeaderCell className="w-custom" style={{ '--w-custom': '10em' }}>{c('BOSS')
                        .t`Status`}</TableHeaderCell>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((u) => (
                    <TableRow key={u.ID}>
                        <TableCell>
                            <div className="flex flex-nowrap items-start">
                                <Checkbox
                                    className="mr-2"
                                    checked={selected.includes(u.ID)}
                                    onChange={handleSelectSingle(u.ID)}
                                />
                                <div>
                                    <p className="m-0">{u.AdminSetName}</p>
                                    <p className="m-0 text-sm color-weak">{u.Email}</p>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>{humanSize({ bytes: u.UsedQuota, fraction: 0 })}</TableCell>
                        <TableCell>{c('BOSS').t`Not started`}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export default ProviderUsersTable;
