import { CONTENT_VERSION } from '../../esBuild';
import type { CleanTextFn, MigrateFn } from '../interface';

export const createMigrations = (cleanText: CleanTextFn): Map<number, MigrateFn> =>
    new Map([
        [
            -1,
            (data) => ({
                ...data,
                content: data.content ? { ...data.content, version: CONTENT_VERSION.V1 } : undefined,
            }),
        ],
        [
            CONTENT_VERSION.V1,
            (data) => ({
                ...data,
                content: data.content ? { ...data.content, version: CONTENT_VERSION.DOM_INDEXING } : undefined,
            }),
        ],
        [
            CONTENT_VERSION.DOM_INDEXING,
            (data) => ({
                ...data,
                content: data.content
                    ? {
                          ...data.content,
                          decryptedBody: cleanText(data.content.decryptedBody || '', false),
                          version: CONTENT_VERSION.BLOCKQUOTE_FIX,
                      }
                    : undefined,
            }),
        ],
    ]);
