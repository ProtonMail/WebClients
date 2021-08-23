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

export type ESBaseMessage = Pick<
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

export interface CachedMessage extends ESBaseMessage {
    decryptedBody?: string;
    decryptedSubject?: string;
    decryptionError: boolean;
}

export type MessageForSearch = Omit<CachedMessage, 'decryptionError' | 'decryptedSubject'>;

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
    lastEmail: LastEmail | undefined;
    previousNormSearchParams: NormalisedSearchParams | undefined;
    page: number;
    cachedIndexKey: CryptoKey | undefined;
    dbExists: boolean;
    isBuilding: boolean;
    isDBLimited: boolean;
    esEnabled: boolean;
    isRefreshing: boolean;
    isSearchPartial: boolean;
    isSearching: boolean;
    isCaching: boolean;
}

export interface ESCache {
    esCache: CachedMessage[];
    cacheSize: number;
    isCacheLimited: boolean;
    isCacheReady: boolean;
}

export interface ESDBStatus
    extends Pick<
            ESStatus,
            | 'dbExists'
            | 'isBuilding'
            | 'isDBLimited'
            | 'esEnabled'
            | 'isRefreshing'
            | 'isSearchPartial'
            | 'isSearching'
            | 'isCaching'
        >,
        Pick<ESCache, 'isCacheLimited'> {}

export interface ESIndexingState {
    esProgress: number;
    estimatedMinutes: number;
    startTime: number;
    endTime: number;
    oldestTime: number;
    esPrevProgress: number;
    totalIndexingMessages: number;
    currentProgressValue: number;
}

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

export type HighlightString = (content: string, setAutoScroll: boolean) => string;

export type HighlightMetadata = (
    metadata: string,
    isBold?: boolean,
    trim?: boolean
) => { numOccurrences: number; resultJSX: JSX.Element };

export type IsSearchResult = (ID: string) => boolean;

export interface EncryptedSearchFunctions {
    encryptedSearch: EncryptedSearch;
    highlightString: HighlightString;
    highlightMetadata: HighlightMetadata;
    isSearchResult: IsSearchResult;
    getESDBStatus: () => ESDBStatus;
    getProgressRecorderRef: () => React.MutableRefObject<[number, number]>;
    toggleEncryptedSearch: () => void;
    resumeIndexing: () => Promise<void>;
    pauseIndexing: () => Promise<void>;
    cacheIndexedDB: () => Promise<void>;
    incrementSearch: IncrementSearch;
    shouldHighlight: () => boolean;
}
