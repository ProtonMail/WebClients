import { ApiReport, ApiReportState, ApiReportSummary } from '@proton/activation/src/api/api.interface';
import { ImportType } from '@proton/activation/src/interface';

export type Report = {
    ID: ApiReport['ID'];
    state: ApiReportState;
    account: ApiReport['Account'];
    startDate: ApiReport['CreateTime'];
    endDate: ApiReport['EndTime'];
    size: ApiReport['TotalSize'];
};

export type ReportSummaryID = `${Report['ID']}-${ImportType}`;
export type ReportSummary = {
    localID: ReportSummaryID;
    reportID: ApiReport['ID'];
    product: keyof ApiReport['Summary'];
    state: ApiReportSummary['State'];
    size: ApiReportSummary['TotalSize'];
    rollbackState: ApiReportSummary['RollbackState'];
};

export type ReportsMap = Record<string, Report>;
export type ReportSummariesMap = Record<string, ReportSummary>;

export interface ReportsState {
    summaries: ReportSummariesMap;
    reports: ReportsMap;
    loading: 'idle' | 'pending' | 'success' | 'failed';
}
