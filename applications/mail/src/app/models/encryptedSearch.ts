import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { DecryptedKey } from 'proton-shared/lib/interfaces';
import { DBSchema } from 'idb';
import { SearchParameters } from './tools';
import { Element } from './element';

export interface ESMetricsReport {
    numMessagesIDB: number;
    sizeIDBOnDisk?: number;
    sizeIDB: number;
    sizeCache: number;
    numMessagesSearched: number;
    searchTime: number;
    numMessagesFound: number;
    isFirstSearch: boolean;
    isCacheLimited: boolean;
}

export type MessageForSearch = Pick<
    Message,
    | 'ID'
    | 'Order'
    | 'ConversationID'
    | 'Subject'
    | 'Unread'
    | 'Sender'
    | 'AddressID'
    | 'Flags'
    | 'IsReplied'
    | 'IsRepliedAll'
    | 'IsForwarded'
    | 'ToList'
    | 'CCList'
    | 'BCCList'
    | 'Time'
    | 'Size'
    | 'NumAttachments'
    | 'ExpirationTime'
    | 'LabelIDs'
>;

export interface CachedMessage extends MessageForSearch {
    decryptedBody?: string;
    decryptedSubject?: string;
    decryptionError: boolean;
}

export interface AesGcmCiphertext {
    iv: Uint8Array;
    ciphertext: ArrayBuffer;
}

export interface StoredCiphertext extends Pick<MessageForSearch, 'ID' | 'LabelIDs' | 'Time' | 'Order'> {
    aesGcmCiphertext: AesGcmCiphertext;
}

export interface EncryptedSearchDB extends DBSchema {
    messages: {
        key: string;
        value: StoredCiphertext;
        indexes: { byTime: number[] };
    };
}

export interface RecoveryPoint {
    ID: string;
    Time: number;
}

export interface LastEmail {
    Time: number;
    Order: number;
}

export interface NormalisedSearchParams extends Omit<SearchParameters, 'wildcard' | 'keyword'> {
    labelID: string;
    normalisedKeywords: string[] | undefined;
    decryptionError?: boolean;
}

export interface ESDBStatus {
    dbExists: boolean;
    isBuilding: boolean;
    isDBLimited: boolean;
    esEnabled: boolean;
    isCacheReady: boolean;
    isCacheLimited: boolean;
    isRefreshing: boolean;
}

export interface ESSearchStatus {
    permanentResults: MessageForSearch[];
    setElementsCache: (Elements: Element[]) => void;
    labelID: string;
    cachePromise: Promise<CachedMessage[]>;
}

export type GetUserKeys = () => Promise<DecryptedKey[]>;

export type EncryptedSearch = (
    searchParams: SearchParameters,
    labelID: string,
    setCache: (Elements: Element[]) => void
) => Promise<boolean>;

export type CacheIndexedDB = (force?: boolean) => Promise<{ cachedMessages: CachedMessage[]; isCacheLimited: boolean }>;

export interface EncryptedSearchFunctions {
    encryptedSearch: EncryptedSearch;
    cacheIndexedDB: CacheIndexedDB;
    getESDBStatus: () => ESDBStatus;
    getProgressRecorderRef: () => React.MutableRefObject<[number, number]>;
    toggleEncryptedSearch: () => void;
    resumeIndexing: () => Promise<void>;
    pauseIndexing: () => Promise<void>;
}
