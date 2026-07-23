import { readScopedLocalStorageJson, writeScopedLocalStorageJson } from './lumoScopedLocalStorage';
import { shouldPersistPaperTrailLocally } from './paperTrailLocalSavePreference';

export const readPaperTrailStorage = <T>(baseKey: string, fallback: T): T => {
    if (!shouldPersistPaperTrailLocally()) {
        return fallback;
    }
    return readScopedLocalStorageJson(baseKey, fallback);
};

export const writePaperTrailStorage = (baseKey: string, value: unknown): void => {
    if (!shouldPersistPaperTrailLocally()) {
        return;
    }
    writeScopedLocalStorageJson(baseKey, value);
};
