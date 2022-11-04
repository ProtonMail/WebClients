import { memo } from 'react';

import { format } from 'date-fns';

import humanSize from '@proton/shared/lib/helpers/humanSize';
import { dateLocale } from '@proton/shared/lib/i18n';

import { TableCell, TableRow } from '../../../components';
import { ReportSummaryID } from '../logic/reports/reports.interface';
import { selectReportById, selectReportSummaryById } from '../logic/reports/reports.selectors';
import { useEasySwitchSelector } from '../logic/store';
import DashboardTableImportCell from './DashboardTableImportCell';
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
        <TableRow>
            <DashboardTableImportCell product={product} title={account} date={endDate} />
            <TableCell>
                <div className="on-mobile-text-center">
                    <ReportRowStatus status={state} rollbackState={rollbackState} />
                </div>
            </TableCell>
            <TableCell>
                <time>{format(endDate * 1000, 'PPp', { locale: dateLocale })}</time>
            </TableCell>
            <TableCell>{humanSize(size)}</TableCell>
            <TableCell>
                <ReportRowActions key="button" reportSummaryID={reportSummaryId} rollbackState={rollbackState} />
            </TableCell>
        </TableRow>
    );
};

export default memo(ReportRow);
