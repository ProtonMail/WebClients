import { readScopedLocalStorageJson, writeScopedLocalStorageJson } from './lumoScopedLocalStorage';

export const readPaperTrailStorage = <T>(baseKey: string, fallback: T): T => {
    return readScopedLocalStorageJson(baseKey, fallback);
};

export const writePaperTrailStorage = (baseKey: string, value: unknown): void => {
    writeScopedLocalStorageJson(baseKey, value);
};
