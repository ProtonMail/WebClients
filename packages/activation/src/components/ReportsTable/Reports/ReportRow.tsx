import { memo } from 'react';

import { c } from 'ttag';

import type { ReportSummaryID } from '@proton/activation/src/logic/reports/reports.interface';
import { selectReportById, selectReportSummaryById } from '@proton/activation/src/logic/reports/reports.selectors';
import { useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { TableCell, TableRow } from '@proton/components';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import ReportsTableCell from '../ReportsTableCell';
import ReportRowActions from './ReportRowActions';
import ReportRowStatus from './ReportRowStatus';

interface Props {
    reportSummaryId: ReportSummaryID;
}

const ReportRow = ({ reportSummaryId }: Props) => {
    const reportSummary = useEasySwitchSelector((state) => selectReportSummaryById(state, reportSummaryId));
    const report = useEasySwitchSelector((state) => selectReportById(state, reportSummary.reportID));

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
                <ReportRowActions key="button" reportSummaryID={reportSummaryId} rollbackState={rollbackState} />
            </TableCell>
        </TableRow>
    );
};

export default memo(ReportRow);
