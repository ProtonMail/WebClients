import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { DecryptedKey } from '@proton/shared/lib/interfaces';
import { DBSchema } from 'idb';
import { Element } from './element';
import { ElementsCacheParams } from '../hooks/mailbox/useElementsCache';

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

export interface NormalisedSearchParams extends Omit<ElementsCacheParams, 'wildcard' | 'keyword' | 'esEnabled'> {
    normalisedKeywords: string[] | undefined;
    decryptionError?: boolean;
}

export type ESSetsElementsCache = (Elements: Element[], page?: number) => void;

export interface ESStatus {
    permanentResults: MessageForSearch[];
    setElementsCache: ESSetsElementsCache;
    labelID: string;
    cachePromise: Promise<CachedMessage[]>;
    lastEmail: LastEmail | undefined;
    previousNormSearchParams: NormalisedSearchParams | undefined;
    page: number;
    cachedIndexKey: CryptoKey | undefined;
    dbExists: boolean;
    isBuilding: boolean;
    isDBLimited: boolean;
    esEnabled: boolean;
    isCacheReady: boolean;
    isCacheLimited: boolean;
    isRefreshing: boolean;
    isSearchPartial: boolean;
    isSearching: boolean;
}

export type ESDBStatus = Pick<
    ESStatus,
    | 'dbExists'
    | 'isBuilding'
    | 'isDBLimited'
    | 'esEnabled'
    | 'isCacheReady'
    | 'isCacheLimited'
    | 'isRefreshing'
    | 'isSearchPartial'
    | 'isSearching'
>;

export interface UncachedSearchOptions {
    incrementMessagesSearched?: () => void;
    messageLimit?: number;
    setCache?: (newResults: MessageForSearch[]) => void;
    beginOrder?: number;
    lastEmailTime?: number;
}

export type GetUserKeys = () => Promise<DecryptedKey[]>;

export type EncryptedSearch = (labelID: string, setCache: ESSetsElementsCache) => Promise<boolean>;

export type IncrementSearch = (
    page: number,
    setElementsCache: ESSetsElementsCache,
    shouldLoadMore: boolean
) => Promise<boolean>;

export type CacheIndexedDB = (force?: boolean) => Promise<{ cachedMessages: CachedMessage[]; isCacheLimited: boolean }>;

export type HighlightString = (content: string, setAutoScroll: boolean) => string;

export type HighlightMetadata = (metadata: string) => JSX.Element;

export type IsSearchResult = (ID: string) => boolean;

export interface EncryptedSearchFunctions {
    encryptedSearch: EncryptedSearch;
    cacheIndexedDB: CacheIndexedDB;
    highlightString: HighlightString;
    highlightMetadata: HighlightMetadata;
    isSearchResult: IsSearchResult;
    getESDBStatus: () => ESDBStatus;
    getProgressRecorderRef: () => React.MutableRefObject<[number, number]>;
    toggleEncryptedSearch: () => void;
    resumeIndexing: () => Promise<void>;
    pauseIndexing: () => Promise<void>;
    incrementSearch: IncrementSearch;
    shouldHighlight: () => boolean;
}
