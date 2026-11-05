import type { ApiReport } from '../../api/api.interface';
import { ApiImporterState } from '../../api/api.interface';
import { ImportType } from '../../interface';
import { getDriveReportOutcome, normalizeReport } from './reports.helpers';
import type { ReportSummariesMap, ReportSummary } from './reports.interface';

const summary = (reportID: string, product: ImportType, state: ApiImporterState): ReportSummary => ({
    localID: `${reportID}-${product}`,
    reportID,
    product,
    state,
    size: 0,
    rollbackState: undefined,
});

const toMap = (...summaries: ReportSummary[]): ReportSummariesMap =>
    Object.fromEntries(summaries.map((item) => [item.localID, item]));

describe('getDriveReportOutcome', () => {
    it('returns success when a Drive summary moves to DONE', () => {
        const previous = toMap(summary('report', ImportType.DRIVE, ApiImporterState.RUNNING));
        const next = toMap(summary('report', ImportType.DRIVE, ApiImporterState.DONE));

        expect(getDriveReportOutcome(previous, next)).toBe('success');
    });

    it('returns failed when a new Drive summary arrives as FAILED', () => {
        const next = toMap(summary('report', ImportType.DRIVE, ApiImporterState.FAILED));

        expect(getDriveReportOutcome({}, next)).toBe('failed');
    });

    it('returns nothing when finished Drive summaries did not change', () => {
        const summaries = toMap(summary('report', ImportType.DRIVE, ApiImporterState.DONE));

        expect(getDriveReportOutcome(summaries, summaries)).toBeUndefined();
    });

    it('ignores summaries of other products', () => {
        const next = toMap(summary('report', ImportType.MAIL, ApiImporterState.DONE));

        expect(getDriveReportOutcome({}, next)).toBeUndefined();
    });
});

describe('normalizeReport', () => {
    const apiReport = (drive: ApiReport['Summary'][ImportType.DRIVE]): ApiReport => ({
        ID: 'report',
        CreateTime: 0,
        EndTime: 0,
        Provider: 1,
        Account: 'user@gmail.com',
        State: 1,
        TotalSize: 0,
        Summary: { [ImportType.DRIVE]: drive },
    });

    it('keeps the import folder of a finished Drive import', () => {
        const { reportSummaries } = normalizeReport(
            apiReport({
                State: ApiImporterState.DONE,
                TotalSize: 0,
                ImportFolderVolumeID: 'volume-id',
                ImportFolderLinkID: 'link-id',
            })
        );

        expect(reportSummaries[0].importFolder).toEqual({ volumeID: 'volume-id', linkID: 'link-id' });
    });

    it('has no import folder when the backend did not send one', () => {
        const { reportSummaries } = normalizeReport(
            apiReport({
                State: ApiImporterState.FAILED,
                TotalSize: 0,
                ImportFolderVolumeID: null,
                ImportFolderLinkID: null,
            })
        );

        expect(reportSummaries[0].importFolder).toBeUndefined();
    });
});
