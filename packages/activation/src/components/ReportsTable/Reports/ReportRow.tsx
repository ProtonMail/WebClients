import { memo } from 'react';

import { c } from 'ttag';

import TableCell from '@proton/components/components/table/TableCell';
import TableRow from '@proton/components/components/table/TableRow';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import type { Report, ReportSummary } from '../../../logic/reports/reports.interface';
import ReportsTableCell from '../ReportsTableCell';
import ReportRowActions from './ReportRowActions';
import ReportRowStatus from './ReportRowStatus';

interface Props {
    reportSummary: ReportSummary;
    report: Report;
}

const ReportRow = ({ reportSummary, report }: Props) => {
    const { product, rollbackState, state, size } = reportSummary;
    const { account, endDate, provider } = report;

    return (
        <TableRow data-testid="reportsTable:reportRow">
            <ReportsTableCell provider={provider} product={product} title={account} importerDate={endDate} />
            <TableCell className="easy-switch-table-size" label={c('Title header').t`Size`}>
                {humanSize({ bytes: size })}
            </TableCell>
            <TableCell className="easy-switch-table-status">
                <div>
                    <ReportRowStatus status={state} rollbackState={rollbackState} />
                </div>
            </TableCell>
            <TableCell className="easy-switch-table-actions">
                <ReportRowActions
                    key="button"
                    reportSummaryID={reportSummary.localID}
                    rollbackState={rollbackState}
                    product={product}
                    provider={provider}
                    account={account}
                />
            </TableCell>
        </TableRow>
    );
};

export default memo(ReportRow);
