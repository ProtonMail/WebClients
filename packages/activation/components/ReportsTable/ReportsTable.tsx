import { useEffect } from 'react';

import { c } from 'ttag';

import { loadDashboard } from '@proton/activation/logic/actions';
import { selectActiveImporterIdsByDate } from '@proton/activation/logic/importers/importers.selectors';
import { selectReportSummaryIdsByDate } from '@proton/activation/logic/reports/reports.selectors';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/logic/store';
import { loadSyncList } from '@proton/activation/logic/sync/sync.actions';
import { selectSyncIds } from '@proton/activation/logic/sync/sync.selectors';
import {
    FeatureCode,
    SettingsParagraph,
    Table,
    TableBody,
    TableHeader,
    TableHeaderCell,
    TableRow,
    useFeature,
} from '@proton/components';

import ImporterRow from './Importers/ImporterRow';
import ReportRow from './Reports/ReportRow';
import ReportsTableInfos from './ReportsTableInfos';
import SyncRow from './Sync/SyncRow';

const ReportsTable = () => {
    const reportIds = useEasySwitchSelector(selectReportSummaryIdsByDate);
    const activeImporterIds = useEasySwitchSelector(selectActiveImporterIdsByDate);
    const syncIdsArray = useEasySwitchSelector(selectSyncIds);
    const dispatch = useEasySwitchDispatch();

    const gmailSync = useFeature(FeatureCode.EasySwitchGmailSync);

    useEffect(() => {
        if (gmailSync.loading) {
            return;
        }

        if (gmailSync.feature && gmailSync.feature.Value) {
            dispatch(loadSyncList());
        }
    }, [gmailSync.loading]);

    useEffect(() => {
        const request = dispatch(loadDashboard());
        return () => {
            request.abort();
        };
    }, []);

    if (reportIds.length === 0 && activeImporterIds.length === 0 && syncIdsArray.length === 0) {
        return (
            <SettingsParagraph data-testid="reportsTable:noImports">{c('Info')
                .t`No imports to display.`}</SettingsParagraph>
        );
    }

    return (
        <>
            <ReportsTableInfos />
            <Table className="on-mobile-hide-td3 on-mobile-hide-td4 simple-table--has-actions">
                <TableHeader>
                    <TableRow>
                        <TableHeaderCell>{c('Title header').t`Import`}</TableHeaderCell>
                        <TableHeaderCell className="on-mobile-w33 on-mobile-text-center">
                            {c('Title header').t`Status`}
                        </TableHeaderCell>
                        <TableHeaderCell className="no-mobile">{c('Title header').t`Date`}</TableHeaderCell>
                        <TableHeaderCell className="no-mobile">{c('Title header').t`Size`}</TableHeaderCell>
                        <TableHeaderCell>{c('Title header').t`Actions`}</TableHeaderCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {syncIdsArray.map((id) => (
                        <SyncRow key={id} syncId={id} />
                    ))}
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

export default ReportsTable;
