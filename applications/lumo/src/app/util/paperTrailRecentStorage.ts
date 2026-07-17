import { readScopedLocalStorageJson, writeScopedLocalStorageJson } from './lumoScopedLocalStorage';

const RECENT_FILES_KEY = 'lumo-ai-paper-trail-recent';
const MAX_RECENT_FILES = 5;

export interface RecentPaperTrailFile {
    filename: string;
    uploadedAt: number;
}

export const getRecentPaperTrailFiles = (): RecentPaperTrailFile[] => {
    return readScopedLocalStorageJson<RecentPaperTrailFile[]>(RECENT_FILES_KEY, []);
};

export const addRecentPaperTrailFile = (filename: string): void => {
    const existing = getRecentPaperTrailFiles().filter((entry) => entry.filename !== filename);
    const updated: RecentPaperTrailFile[] = [{ filename, uploadedAt: Date.now() }, ...existing].slice(
        0,
        MAX_RECENT_FILES
    );
    writeScopedLocalStorageJson(RECENT_FILES_KEY, updated);
};
