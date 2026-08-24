import type { FC } from 'react';

import { c } from 'ttag';

import { TableRowLoading } from '@proton/pass/components/Layout/Table/TableRowLoading';
import type { UsageReport } from '@proton/pass/lib/organization/types';

import Info from '../../../components/link/Info';
import Table from '../../../components/table/Table';
import TableBody from '../../../components/table/TableBody';
import TableCell from '../../../components/table/TableCell';
import TableHeader from '../../../components/table/TableHeader';
import TableHeaderCell from '../../../components/table/TableHeaderCell';
import TableRow from '../../../components/table/TableRow';
import Time from '../../../components/time/Time';

type Props = {
    reports: UsageReport[];
    loading: boolean;
};

export const PassReportsUsageTable: FC<Props> = ({ reports, loading }) => {
    return (
        <Table responsive="cards" borderWeak>
            <TableHeader>
                <TableRow>
                    <TableHeaderCell className="w-1/4">{c('Title').t`User`}</TableHeaderCell>
                    <TableHeaderCell>{c('Title').t`Items owned`}</TableHeaderCell>
                    <TableHeaderCell>
                        {c('Title').t`Accessible items`}{' '}
                        <Info
                            className="color-weak"
                            questionMark
                            title={c('Info')
                                .t`Number of items the user has access to (includes owned items + shared items)`}
                        />
                    </TableHeaderCell>
                    <TableHeaderCell>{c('Title').t`Vault owned`}</TableHeaderCell>
                    <TableHeaderCell>
                        {c('Title').t`Accessible vaults`}{' '}
                        <Info
                            className="color-weak"
                            questionMark
                            title={c('Info')
                                .t`Number of vaults the user has access to (includes owned vaults + shared vaults)`}
                        />
                    </TableHeaderCell>
                    <TableHeaderCell>{c('Title').t`Last activity`}</TableHeaderCell>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRowLoading rows={1} cells={6} />
                ) : (
                    reports.map((report) => {
                        return (
                            <TableRow key={report.primaryEmail}>
                                <TableCell
                                    label={c('Title').t`User`}
                                    className="text-ellipsis"
                                    title={report.primaryEmail}
                                >
                                    {report.primaryEmail}
                                </TableCell>
                                <TableCell label={c('Title').t`Items owned`}>{report.OwnedItemCount}</TableCell>
                                <TableCell label={c('Title').t`Accessible items`}>
                                    {report.AccessibleItemCount}
                                </TableCell>
                                <TableCell label={c('Title').t`Vault owned`}>{report.OwnedVaultCount}</TableCell>
                                <TableCell label={c('Title').t`Accessible vaults`}>
                                    {report.AccessibleVaultCount}
                                </TableCell>
                                <TableCell label={c('Title').t`Last activity`}>
                                    {report.lastActivityTime && <Time format="PPp">{report.lastActivityTime}</Time>}
                                </TableCell>
                            </TableRow>
                        );
                    })
                )}
            </TableBody>
        </Table>
    );
};
