import { DBSchema } from 'idb';

import { ESStoredItem, EncryptedSearchFunctions } from '@proton/encrypted-search';

export interface ESLink {
    createTime: number;
    decryptedName: string;
    id: string;
    linkId: string;
    MIMEType: string;
    modifiedTime: number;
    parentLinkId: string | null;
    shareId: string;
    size: number;
    order: number;
}

export interface StoredCiphertextDrive
    extends ESStoredItem,
        Pick<ESLink, 'createTime' | 'id' | 'linkId' | 'modifiedTime' | 'parentLinkId' | 'shareId' | 'size' | 'order'> {}

export interface EncryptedSearchDB extends DBSchema {
    files: {
        key: string;
        value: StoredCiphertextDrive;
        indexes: { byUploadedTime: number };
    };
}

export interface ESDriveSearchParams {
    normalisedKeywords: string[] | undefined;
}

export interface EncryptedSearchFunctionsDrive
    extends Pick<
        EncryptedSearchFunctions<ESLink, ESDriveSearchParams, ESLink>,
        | 'handleEvent'
        | 'encryptedSearch'
        | 'highlightString'
        | 'highlightMetadata'
        | 'resumeIndexing'
        | 'isSearchResult'
        | 'esDelete'
        | 'getESDBStatus'
        | 'getProgressRecorderRef'
        | 'shouldHighlight'
        | 'pauseIndexing'
        | 'cacheIndexedDB'
        | 'toggleEncryptedSearch'
    > {}

export interface Session {
    sessionName: string;
    total: number;
    isDone: boolean;
}

export type ESItemChangesDrive = ESLink;
