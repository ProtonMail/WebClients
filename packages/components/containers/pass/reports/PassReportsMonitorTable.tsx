import type { FC } from 'react';

import { c } from 'ttag';

import Info from '@proton/components/components/link/Info';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableHeaderCell from '@proton/components/components/table/TableHeaderCell';
import TableRow from '@proton/components/components/table/TableRow';
import Time from '@proton/components/components/time/Time';
import { TableRowLoading } from '@proton/pass/components/Layout/Table/TableRowLoading';
import type { MonitorReport } from '@proton/pass/lib/organization/types';

type Props = {
    reports: MonitorReport[];
    loading: boolean;
};

export const PassReportsMonitorTable: FC<Props> = ({ reports, loading }) => {
    return (
        <Table responsive="cards" borderWeak>
            <TableHeader>
                <TableRow>
                    <TableHeaderCell className="w-1/4">{c('Title').t`User`}</TableHeaderCell>
                    <TableHeaderCell>{c('Title').t`Reused passwords`}</TableHeaderCell>
                    <TableHeaderCell>{c('Title').t`Inactive 2FA`}</TableHeaderCell>
                    <TableHeaderCell>{c('Title').t`Weak passwords`}</TableHeaderCell>
                    <TableHeaderCell>{c('Title').t`Excluded items`}</TableHeaderCell>
                    <TableHeaderCell>{c('Title').t`Email breaches`}</TableHeaderCell>
                    <TableHeaderCell>
                        {c('Title').t`Last updated`}{' '}
                        <Info
                            className="color-weak"
                            questionMark
                            title={c('Info').t`The most recent data update, excluding breaches.`}
                        />
                    </TableHeaderCell>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRowLoading rows={1} cells={7} />
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
                                <TableCell label={c('Title').t`Reused passwords`}>{report.ReusedPasswords}</TableCell>
                                <TableCell label={c('Title').t`Inactive 2FA`}>{report.Inactive2FA}</TableCell>
                                <TableCell label={c('Title').t`Weak passwords`}>{report.WeakPasswords}</TableCell>
                                <TableCell label={c('Title').t`Excluded items`}>{report.ExcludedItems}</TableCell>
                                <TableCell label={c('Title').t`Email breaches`}>{report.emailBreachCount}</TableCell>
                                <TableCell label={c('Title').t`Last updated`}>
                                    {report.ReportTime && <Time format="PPp">{report.ReportTime}</Time>}
                                </TableCell>
                            </TableRow>
                        );
                    })
                )}
            </TableBody>
        </Table>
    );
};
