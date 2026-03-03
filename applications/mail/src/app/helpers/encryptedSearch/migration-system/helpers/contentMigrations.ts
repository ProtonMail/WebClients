import { CONTENT_VERSION, cleanText } from '../../esBuild';
import type { MigrateFn } from '../interface';

export const migrations = new Map<number, MigrateFn>([
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
