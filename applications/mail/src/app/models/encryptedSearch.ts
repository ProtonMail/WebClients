import type {
    ContentSearchActionSurface,
    ContentSearchResultAction,
    ESItem,
    ESStatus,
    EncryptedSearchFunctions,
    NormalizedSearchParams,
} from '@proton/encrypted-search/models';
import type { MIME_TYPES } from '@proton/shared/lib/constants';
import type { MessageMetadata } from '@proton/shared/lib/interfaces/mail/Message';

export type ESBaseMessage = Pick<
    MessageMetadata,
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
    | 'AttachmentsMetadata'
    | 'SnoozeTime'
>;

export interface ESMessageContent {
    decryptedBody?: string;
    decryptedSubject?: string;
    mimeType?: MIME_TYPES;
    version?: number;
}

export interface ESDBStatusMail {
    dropdownOpened: boolean;
    temporaryToggleOff: boolean;
    lastContentTime: number;
    /**
     * Whether ES startup has settled, i.e. whether `dbExists` and `esEnabled` can be trusted. They are
     * filled in asynchronously by `EncryptedSearchProvider`'s startup routine, so anything that decides
     * between the index and the server (see `isES`) has to wait for this first.
     */
    isStartupSettled: boolean;
}

export interface EncryptedSearchFunctionsMail extends Pick<
    EncryptedSearchFunctions<ESBaseMessage, NormalizedSearchParams, ESMessageContent>,
    | 'encryptedSearch'
    | 'highlightString'
    | 'highlightMetadata'
    | 'enableEncryptedSearch'
    | 'enableContentSearch'
    | 'isSearchResult'
    | 'esDelete'
    | 'progressRecorderRef'
    | 'shouldHighlight'
    | 'pauseContentIndexing'
    | 'pauseMetadataIndexing'
    | 'cacheIndexedDB'
    | 'toggleEncryptedSearch'
    | 'esIndexingProgressState'
    | 'resetCache'
> {
    openDropdown: () => void;
    closeDropdown: () => void;
    setTemporaryToggleOff: () => void;
    esStatus: ESDBStatusMail & ESStatus<ESBaseMessage, ESMessageContent, NormalizedSearchParams>;
    /**
     * Routes to v1's or v2's telemetry depending on which engine answered the search. `scrollerMode`
     * and `primaryMatchType` aren't exposed here: both are hardcoded inside the two implementations
     * (see `SEARCH_RESULT_SCROLLER_MODE`/`SEARCH_RESULT_PRIMARY_MATCH_TYPE`), not derived per call.
     */
    reportResultOpened: (params: { isFirstOpen: boolean; resultPosition: number; messageAgeDays: number }) => void;
    reportResultAction: (params: {
        action: ContentSearchResultAction;
        actionSurface: ContentSearchActionSurface;
    }) => void;
}

export type ESMessage = ESItem<ESBaseMessage, ESMessageContent>;

export type MetadataRecoveryPoint = {
    End?: number;
    EndID?: string;
};
