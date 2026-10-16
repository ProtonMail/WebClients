import { c } from 'ttag';

import { ApiImporterState, ApiReportRollbackState } from '../../../api/api.interface';
import type { ReportSummary } from '../../../logic/reports/reports.interface';

/**
 * Status of a finished report. Returns undefined for the states a report doesn't display.
 */
export const getReportString = (status: ApiImporterState) => {
    switch (status) {
        case ApiImporterState.QUEUED:
            return c('Import status').t`Queued`;
        case ApiImporterState.DONE:
            return c('Import status').t`Imported`;
        case ApiImporterState.FAILED:
            return c('Import status').t`Failed`;
        case ApiImporterState.PAUSED:
            return c('Import status').t`Paused`;
        case ApiImporterState.CANCELED:
            return c('Import status').t`Canceled`;
        default:
            return undefined;
    }
};

/**
 * Status of an importer that is still active. Returns undefined for the finished states (done, failed).
 */
export const getImporterString = (state: ApiImporterState | undefined) => {
    switch (state) {
        case undefined:
        case ApiImporterState.QUEUED:
        case ApiImporterState.RUNNING:
            // translator: When an import in easy switch section is running
            return c('Import status').t`In progress...`;
        case ApiImporterState.PAUSED:
            // translator: When the user decided to pause an import in easy switch section
            return c('Import status').t`Paused`;
        case ApiImporterState.CANCELED:
            // translator: When the user decides to cancel an import in easy switch section
            return c('Import status').t`Canceling...`;
        case ApiImporterState.DELAYED:
            // translator: When an import in easy switch section has been delayed
            return c('Import status').t`Delayed`;
        default:
            return undefined;
    }
};

/**
 * Returns undefined when there is nothing to display (can or cannot rollback).
 */
export const getRollbackStateString = (rollbackState: ApiReportRollbackState) => {
    switch (rollbackState) {
        case ApiReportRollbackState.ROLLING_BACK:
            return c('Rollback state').t`Undo in progress`;
        case ApiReportRollbackState.ROLLED_BACK:
            return c('Rollback state').t`Undo finished`;
        default:
            return undefined;
    }
};

/**
 * Rollback state takes precedence over the report state when an undo is running or finished.
 */
export const getSummaryString = (reportSummary: ReportSummary) => {
    if (
        reportSummary.rollbackState === ApiReportRollbackState.ROLLED_BACK ||
        reportSummary.rollbackState === ApiReportRollbackState.ROLLING_BACK
    ) {
        return getRollbackStateString(reportSummary.rollbackState);
    }

    return getReportString(reportSummary.state);
};
