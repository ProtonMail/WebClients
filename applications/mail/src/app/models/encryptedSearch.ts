import { ESItem, ESStatus, EncryptedSearchFunctions } from '@proton/encrypted-search';
import { MessageMetadata } from '@proton/shared/lib/interfaces/mail/Message';

import { Filter, SearchParameters, Sort } from './tools';

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
}

export interface ESDBStatusMail {
    dropdownOpened: boolean;
    temporaryToggleOff: boolean;
    lastContentTime: number;
}

export interface EncryptedSearchFunctionsMail
    extends Pick<
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
}

export interface NormalizedSearchParams extends Omit<SearchParameters, 'wildcard' | 'keyword'> {
    labelID: string;
    sort: Sort;
    filter: Filter;
    search: SearchParameters;
    normalizedKeywords: string[] | undefined;
}

export type ESMessage = ESItem<ESBaseMessage, ESMessageContent>;

export type MetadataRecoveryPoint = {
    End?: number;
    EndID?: string;
};
