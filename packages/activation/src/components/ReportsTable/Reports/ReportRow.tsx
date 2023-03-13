import { memo } from 'react';

import { format } from 'date-fns';
import { c } from 'ttag';

import { ReportSummaryID } from '@proton/activation/src/logic/reports/reports.interface';
import { selectReportById, selectReportSummaryById } from '@proton/activation/src/logic/reports/reports.selectors';
import { useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { TableCell, TableRow } from '@proton/components';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { dateLocale } from '@proton/shared/lib/i18n';

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
    const { account, endDate } = report;

    return (
        <TableRow data-testid="reportsTable:reportRow">
            <ReportsTableCell product={product} title={account} />
            <TableCell>
                <div>
                    <ReportRowStatus status={state} rollbackState={rollbackState} />
                </div>
            </TableCell>
            <TableCell>
                <time>{format(endDate * 1000, 'PPp', { locale: dateLocale })}</time>
            </TableCell>
            <TableCell label={c('Title header').t`Size`}>{humanSize(size)}</TableCell>
            <TableCell>
                <ReportRowActions key="button" reportSummaryID={reportSummaryId} rollbackState={rollbackState} />
            </TableCell>
        </TableRow>
    );
};

export default memo(ReportRow);
