import { ESDBStatus, ESItem, EncryptedSearchFunctions } from '@proton/encrypted-search';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { Filter, SearchParameters, Sort } from './tools';

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
        | 'getProgressRecorderRef'
        | 'shouldHighlight'
        | 'pauseIndexing'
        | 'cacheIndexedDB'
        | 'cacheMetadataOnly'
        | 'getESCache'
        | 'toggleEncryptedSearch'
        | 'resetCache'
    > {
    openDropdown: () => void;
    closeDropdown: () => void;
    setTemporaryToggleOff: () => void;
    getESDBStatus: () => ESDBStatusMail & ESDBStatus<ESBaseMessage, ESMessageContent, NormalizedSearchParams>;
    cacheMailContent: () => Promise<void>;
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
