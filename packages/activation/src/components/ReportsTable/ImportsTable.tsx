import { useEffect } from 'react';

import { c } from 'ttag';

import { loadDashboard } from '@proton/activation/src/logic/actions';
import { selectActiveImporterIdsByDate } from '@proton/activation/src/logic/importers/importers.selectors';
import { selectReportSummaryIdsByDate } from '@proton/activation/src/logic/reports/reports.selectors';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { SettingsSectionTitle, Table, TableBody } from '@proton/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import ImporterRow from './Importers/ImporterRow';
import ReportRow from './Reports/ReportRow';
import ReportsTableInfos from './ReportsTableInfos';

const ImportsTable = () => {
    const reportIds = useEasySwitchSelector(selectReportSummaryIdsByDate);
    const activeImporterIds = useEasySwitchSelector(selectActiveImporterIdsByDate);
    const dispatch = useEasySwitchDispatch();

    useEffect(() => {
        const request = dispatch(loadDashboard());
        return () => {
            request.abort();
        };
    }, []);

    if (reportIds.length === 0 && activeImporterIds.length === 0) {
        return null;
    }

    return (
        <>
            <SettingsSectionTitle>{c('Title').t`Imports`}</SettingsSectionTitle>
            <div className="mb-2 color-weak">{c('Info')
                .t`Import show one-time transfers of email, calendars, or contacts into your ${BRAND_NAME} account.`}</div>
            <ReportsTableInfos />
            <Table
                hasActions
                responsive="cards"
                className="simple-table--border-weak simple-table--border-lines-rounded easy-switch-table"
            >
                <TableBody>
                    {activeImporterIds.map((id) => (
                        <ImporterRow key={id} activeImporterId={id} />
                    ))}
                    {reportIds.map((id) => (
                        <ReportRow key={id} reportSummaryId={id} />
                    ))}
                </TableBody>
            </Table>
        </>
    );
};

export default ImportsTable;
