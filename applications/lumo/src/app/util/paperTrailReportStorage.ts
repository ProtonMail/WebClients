import type { PaperTrailReport } from '../features/aiPaperTrail/reportTypes';
import { shouldPersistPaperTrailLocally } from './paperTrailLocalSavePreference';
import { readPaperTrailStorage, writePaperTrailStorage } from './paperTrailStorage';

const REPORTS_KEY = 'lumo-ai-paper-trail-reports';

type StoredReports = Record<string, PaperTrailReport>;

const readReports = (): StoredReports => readPaperTrailStorage<StoredReports>(REPORTS_KEY, {});

export const savePaperTrailReport = (id: string, report: PaperTrailReport): void => {
    if (!shouldPersistPaperTrailLocally()) {
        return;
    }
    const reports = readReports();
    reports[id] = report;
    writePaperTrailStorage(REPORTS_KEY, reports);
};

export const getPaperTrailReport = (id: string): PaperTrailReport | undefined => {
    return readReports()[id];
};

export const hasPaperTrailReport = (id: string): boolean => {
    return id in readReports();
};

export const deletePaperTrailReport = (id: string): void => {
    const reports = readReports();
    if (!(id in reports)) {
        return;
    }
    const { [id]: _removed, ...rest } = reports;
    writePaperTrailStorage(REPORTS_KEY, rest);
};

export const prunePaperTrailReports = (keepIds: string[]): void => {
    const keep = new Set(keepIds);
    const reports = readReports();
    const pruned = Object.fromEntries(Object.entries(reports).filter(([id]) => keep.has(id)));
    writePaperTrailStorage(REPORTS_KEY, pruned);
};

export const getPaperTrailReportIds = (): string[] => {
    return Object.keys(readReports());
};
