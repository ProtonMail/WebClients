import { createSelector } from '@reduxjs/toolkit';

import orderBy from '@proton/utils/orderBy';

import type { EasySwitchState } from '../store';
import type { Report, ReportSummariesMap, ReportSummary, ReportsMap } from './reports.interface';

const selectReportsMap = (state: EasySwitchState): ReportsMap => state.reports.reports;
export const selectReportsSummariesMap = (state: EasySwitchState): ReportSummariesMap => state.reports.summaries;
export const selectReportsLoading = (state: EasySwitchState) => state.reports.loading;

const selectReports = createSelector(selectReportsMap, (reportsMap): Report[] => {
    const reports = Object.values(reportsMap);
    return reports;
});

const selectReportSummaries = createSelector(selectReportsSummariesMap, (reportsSummariesMap): ReportSummary[] => {
    const summaries = Object.values(reportsSummariesMap);
    return summaries;
});

/**
 * @returns array of report summaries with their report, ordered by report date DESC
 */
export const selectReportEntriesByDate = createSelector(
    [selectReports, selectReportSummaries],
    (reports, summaries): { summary: ReportSummary; report: Report }[] =>
        orderBy(reports, 'endDate')
            .flatMap((report) =>
                summaries.filter(({ reportID }) => reportID === report.ID).map((summary) => ({ summary, report }))
            )
            .reverse()
);
