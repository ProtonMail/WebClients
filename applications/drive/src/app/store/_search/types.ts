import type { ESDriveSearchParams } from '@proton/encrypted-search/lib/models/drive';
import type { EncryptedSearchFunctions } from '@proton/encrypted-search/models';

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

export interface EncryptedSearchFunctionsDrive extends Pick<
    EncryptedSearchFunctions<ESLink, ESDriveSearchParams>,
    | 'handleEvent'
    | 'encryptedSearch'
    | 'enableEncryptedSearch'
    | 'esDelete'
    | 'esStatus'
    | 'progressRecorderRef'
    | 'esIndexingProgressState'
    | 'cacheIndexedDB'
> {}

export interface Session {
    sessionName: string;
    total: number;
    isDone: boolean;
}
