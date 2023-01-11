import { ApiImportReportListResponse, ApiReport } from '@proton/activation/api/api.interface';
import { ImportType } from '@proton/activation/interface';

import { Report, ReportSummariesMap, ReportSummary, ReportsMap } from './reports.interface';

type NormalizeReport = (apiReport: ApiReport) => { report: Report; reportSummaries: ReportSummary[] };
export const normalizeReport: NormalizeReport = (apiReport) => {
    const report: Report = {
        ID: apiReport.ID,
        account: apiReport.Account,
        startDate: apiReport.CreateTime,
        endDate: apiReport.EndTime,
        size: apiReport.TotalSize,
        state: apiReport.State,
    };
    const reportSummaries: ReportSummary[] = [];

    if (apiReport.Summary) {
        Object.entries(apiReport.Summary).forEach(([key, { RollbackState, State, TotalSize }]) => {
            const product = key as ImportType;
            const summary: ReportSummary = {
                localID: `${apiReport.ID}-${product}`,
                reportID: apiReport.ID,
                product,
                rollbackState: RollbackState,
                size: TotalSize,
                state: State,
            };

            reportSummaries.push(summary);
        });
    }

    return { report, reportSummaries };
};

type NormalizeReports = (reportsResponse: ApiImportReportListResponse) => {
    reportsMap: ReportsMap;
    reportSummariesMap: ReportSummariesMap;
};
export const normalizeReports: NormalizeReports = (reportsResponse) => {
    const reports: Report[] = [];
    const reportSummaries: ReportSummary[] = [];

    reportsResponse.Reports.forEach((report) => {
        const formattedReport = normalizeReport(report);

        reports.push(formattedReport.report);
        formattedReport.reportSummaries.forEach((reportSummary) => {
            reportSummaries.push(reportSummary);
        });
    });

    const reportsMap = reports.reduce<ReportsMap>((acc, report) => {
        acc[report.ID] = report;
        return acc;
    }, {});

    const reportSummariesMap = reportSummaries.reduce<ReportSummariesMap>((acc, reportSummary) => {
        acc[reportSummary.localID] = reportSummary;
        return acc;
    }, {});

    return { reportsMap, reportSummariesMap };
};
