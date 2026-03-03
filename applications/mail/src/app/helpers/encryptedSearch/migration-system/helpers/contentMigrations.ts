import { CONTENT_VERSION } from '../../esBuild';
import type { CleanTextFn, MigrateFn } from '../interface';

export const createMigrations = (cleanText: CleanTextFn): Map<number, MigrateFn> =>
    new Map([
        [
            CONTENT_VERSION.DOM_INDEXING,
            (data) => ({
                ...data,
                content: data.content
                    ? { ...data.content, decryptedBody: cleanText(data.content.decryptedBody || '', false) }
                    : undefined,
            }),
        ],
    ]);
