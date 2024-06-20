import { createSelector } from '@reduxjs/toolkit';

import orderBy from '@proton/utils/orderBy';

import { EasySwitchState } from '../store';
import { Report, ReportSummariesMap, ReportSummary, ReportSummaryID, ReportsMap } from './reports.interface';

const selectReportsMap = (state: EasySwitchState): ReportsMap => state.reports.reports;
const selectReportsSummariesMap = (state: EasySwitchState): ReportSummariesMap => state.reports.summaries;

export const selectReportById = createSelector(
    selectReportsMap,
    (_: EasySwitchState, ID: string) => ID,
    (reportsMap, ID) => reportsMap[ID]
);
export const selectReportSummaryById = createSelector(
    selectReportsSummariesMap,
    (_: EasySwitchState, ID: ReportSummaryID) => ID,
    (summariesMap, ID) => summariesMap[ID]
);

const selectReports = createSelector(selectReportsMap, (reportsMap): Report[] => {
    const reports = Object.values(reportsMap);
    return reports;
});

const selectReportSummaries = createSelector(selectReportsSummariesMap, (reportsSummariesMap): ReportSummary[] => {
    const summaries = Object.values(reportsSummariesMap);
    return summaries;
});

/**
 * @returns array of summary ids ordered by report date DESC
 */
export const selectReportSummaryIdsByDate = createSelector(
    [selectReports, selectReportSummaries],
    (reports, summaries) =>
        orderBy(reports, 'endDate')
            .reduce<ReportSummaryID[]>((acc, { ID }) => {
                const ids = summaries.filter(({ reportID }) => reportID === ID).map(({ localID }) => localID);
                acc = [...acc, ...ids];
                return acc;
            }, [])
            .reverse()
);
