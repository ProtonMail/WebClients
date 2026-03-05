import { CONTENT_VERSION } from '../../esBuild';
import type { CleanTextFn, EncryptedSearchData, MigrationMethod } from '../interface';

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

export const getMigrationArray = (cleanText: CleanTextFn): MigrationMethod[] => {
    return [
        {
            targetVersion: CONTENT_VERSION.V1,
            fn: upgradeToVersionOne,
        },
        {
            targetVersion: CONTENT_VERSION.DOM_INDEXING,
            fn: upgradeToDomIndexing,
        },
        {
            targetVersion: CONTENT_VERSION.BLOCKQUOTE_FIX,
            fn: (data) => upgradeToBlockquoteFix(data, cleanText),
        },
    ];
};
