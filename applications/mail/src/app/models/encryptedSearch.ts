import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { DecryptedKey } from '@proton/shared/lib/interfaces';
import { DBSchema } from 'idb';
import { Element } from './element';
import { ElementsStateParams } from '../logic/elements/elementsTypes';

export interface ESMetrics {
    indexSize: number;
    numMessagesIndexed: number;
}

export interface ESSearchMetrics extends ESMetrics {
    cacheSize: number;
    isFirstSearch: boolean;
    isCacheLimited: boolean;
    searchTime: number;
}

export interface ESIndexMetrics extends ESMetrics {
    numPauses: number;
    originalEstimate: number;
    numInterruptions: number;
    isRefreshed: boolean;
    indexTime: number;
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
    | 'AttachmentInfo'
>;

export interface ESMessage extends ESBaseMessage {
    decryptedBody?: string;
    decryptedSubject?: string;
    decryptionError: boolean;
}

export interface AesGcmCiphertext {
    iv: Uint8Array;
    ciphertext: ArrayBuffer;
}

export interface StoredCiphertext extends Pick<ESMessage, 'ID' | 'LabelIDs' | 'Time' | 'Order'> {
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

export interface NormalisedSearchParams
    extends Omit<ElementsStateParams, 'wildcard' | 'keyword' | 'esEnabled' | 'conversationMode'> {
    normalisedKeywords: string[] | undefined;
    decryptionError?: boolean;
}

export type ESSetsElementsCache = (Elements: Element[], page: number) => void;

export interface ESStatus {
    permanentResults: ESMessage[];
    setElementsCache: ESSetsElementsCache;
    labelID: string;
    lastEmail: LastEmail | undefined;
    previousNormSearchParams: NormalisedSearchParams | undefined;
    cachedIndexKey: CryptoKey | undefined;
    dbExists: boolean;
    isBuilding: boolean;
    isDBLimited: boolean;
    esEnabled: boolean;
    isRefreshing: boolean;
    isSearchPartial: boolean;
    isSearching: boolean;
    isCaching: boolean;
    isFirstSearch: boolean;
    dropdownOpened: boolean;
}

export interface ESCache {
    esCache: ESMessage[];
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
            | 'dropdownOpened'
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
    messageLimit?: number;
    setCache?: (newResults: ESMessage[]) => void;
    beginOrder?: number;
    lastEmailTime?: number;
    abortSearchingRef?: React.MutableRefObject<AbortController>;
}

export type GetUserKeys = () => Promise<DecryptedKey[]>;

export interface ESProgressBlob {
    totalMessages: number;
    numPauses: number;
    isRefreshed: boolean;
    timestamps: { type: 'start' | 'step' | 'stop'; time: number }[];
    currentMessages?: number;
    originalEstimate: number;
}

export type EncryptedSearch = (labelID: string, setCache: ESSetsElementsCache) => Promise<boolean>;

export type IncrementSearch = (
    page: number,
    setElementsCache: ESSetsElementsCache,
    shouldLoadMore: boolean
) => Promise<void>;

export type HighlightString = (content: string, setAutoScroll: boolean) => string;

export type HighlightMetadata = (
    metadata: string,
    isBold?: boolean,
    trim?: boolean
) => { numOccurrences: number; resultJSX: JSX.Element };

export type IsSearchResult = (ID: string) => boolean;

export type ResumeIndexing = (options?: { notify?: boolean; isRefreshed?: boolean }) => Promise<void>;

export interface EncryptedSearchFunctions {
    encryptedSearch: EncryptedSearch;
    highlightString: HighlightString;
    highlightMetadata: HighlightMetadata;
    isSearchResult: IsSearchResult;
    resumeIndexing: ResumeIndexing;
    getESDBStatus: () => ESDBStatus;
    getProgressRecorderRef: () => React.MutableRefObject<[number, number]>;
    toggleEncryptedSearch: () => void;
    pauseIndexing: () => Promise<void>;
    cacheIndexedDB: () => Promise<void>;
    incrementSearch: IncrementSearch;
    shouldHighlight: () => boolean;
    esDelete: () => Promise<void>;
    openDropdown: () => void;
    closeDropdown: () => void;
}
