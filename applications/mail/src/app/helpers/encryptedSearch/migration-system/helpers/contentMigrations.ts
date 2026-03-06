import type { ESMessageContent } from 'proton-mail/models/encryptedSearch';

import { CONTENT_VERSION } from '../../esBuild';
import type { CleanTextFn, MigrationMethod } from '../interface';

const upgradeToVersionOne = async (data?: ESMessageContent): Promise<ESMessageContent | undefined> => {
    if (!data) {
        return undefined;
    }

    return {
        ...data,
        version: CONTENT_VERSION.V1,
    };
};

const upgradeToDomIndexing = async (data?: ESMessageContent): Promise<ESMessageContent | undefined> => {
    if (!data) {
        return undefined;
    }

    return {
        ...data,
        version: CONTENT_VERSION.DOM_INDEXING,
    };
};

const upgradeToBlockquoteFix = async (
    cleanText: CleanTextFn,
    data?: ESMessageContent
): Promise<ESMessageContent | undefined> => {
    if (!data) {
        return undefined;
    }

    return {
        ...data,
        decryptedBody: await cleanText(data.decryptedBody || '', false),
        version: CONTENT_VERSION.BLOCKQUOTE_FIX,
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
            fn: (data) => upgradeToBlockquoteFix(cleanText, data),
        },
    ];
};
