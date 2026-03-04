import { CONTENT_VERSION } from '../../esBuild';
import type { CleanTextFn, EncryptedSearchData, MigrateFn } from '../interface';

const upgradeToVersionOne = (data: EncryptedSearchData): EncryptedSearchData => {
    return {
        ...data,
        content: data.content ? { ...data.content, version: CONTENT_VERSION.V1 } : undefined,
    };
};

const upgradeToDomIndexing = (data: EncryptedSearchData): EncryptedSearchData => {
    return {
        ...data,
        content: data.content ? { ...data.content, version: CONTENT_VERSION.DOM_INDEXING } : undefined,
    };
};

const upgradeToBlockquoteFix = (data: EncryptedSearchData, cleanText: CleanTextFn): EncryptedSearchData => {
    return {
        ...data,
        content: data.content
            ? {
                  ...data.content,
                  decryptedBody: cleanText(data.content.decryptedBody || '', false),
                  version: CONTENT_VERSION.BLOCKQUOTE_FIX,
              }
            : undefined,
    };
};

export const getMigrationMap = (cleanText: CleanTextFn): Map<CONTENT_VERSION, MigrateFn> => {
    return new Map([
        [CONTENT_VERSION.V1, upgradeToVersionOne],
        [CONTENT_VERSION.DOM_INDEXING, upgradeToDomIndexing],
        [CONTENT_VERSION.BLOCKQUOTE_FIX, (data) => upgradeToBlockquoteFix(data, cleanText)],
    ]);
};
