import type { PaperTrailSource } from '../features/aiPaperTrail/parsers/types';
import { shouldPersistPaperTrailLocally } from './paperTrailLocalSavePreference';
import { readPaperTrailStorage, writePaperTrailStorage } from './paperTrailStorage';
import { deletePaperTrailReport, prunePaperTrailReports } from './paperTrailReportStorage';

const RECENT_FILES_KEY = 'lumo-ai-paper-trail-recent';
const MAX_RECENT_FILES = 5;

export interface RecentPaperTrailFile {
    id: string;
    source: PaperTrailSource;
    uploadedAt: number;
}

const isRecentEntry = (entry: unknown): entry is RecentPaperTrailFile => {
    if (!entry || typeof entry !== 'object') {
        return false;
    }
    const record = entry as Record<string, unknown>;
    return (
        typeof record.id === 'string' &&
        (record.source === 'chatgpt' || record.source === 'claude') &&
        typeof record.uploadedAt === 'number'
    );
};

export const getRecentPaperTrailFiles = (): RecentPaperTrailFile[] => {
    const stored = readPaperTrailStorage<unknown[]>(RECENT_FILES_KEY, []);
    return stored.filter(isRecentEntry);
};

export const addRecentPaperTrailFile = (source: PaperTrailSource): string => {
    if (!shouldPersistPaperTrailLocally()) {
        return String(Date.now());
    }
    const id = String(Date.now());
    const existing = getRecentPaperTrailFiles();
    const updated: RecentPaperTrailFile[] = [{ id, source, uploadedAt: Date.now() }, ...existing].slice(
        0,
        MAX_RECENT_FILES
    );
    writePaperTrailStorage(RECENT_FILES_KEY, updated);
    prunePaperTrailReports(updated.map((entry) => entry.id));
    return id;
};

export const removeRecentPaperTrailFile = (id: string): void => {
    const updated = getRecentPaperTrailFiles().filter((entry) => entry.id !== id);
    writePaperTrailStorage(RECENT_FILES_KEY, updated);
    deletePaperTrailReport(id);
};
