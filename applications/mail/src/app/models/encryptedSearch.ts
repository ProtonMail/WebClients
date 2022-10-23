import { ESDBStatus, ESStoredItem, EncryptedSearchFunctions } from '@proton/encrypted-search';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { LabelIDsChanges } from './event';
import { Filter, SearchParameters, Sort } from './tools';

export type ESBaseMessage = Pick<
    Message,
    | 'ID'
    | 'DisplaySenderImage'
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
    | 'BimiSelector'
>;

export interface ESDBStatusMail {
    dropdownOpened: boolean;
    temporaryToggleOff: boolean;
}

export interface EncryptedSearchFunctionsMail
    extends Pick<
        EncryptedSearchFunctions<ESMessage, NormalizedSearchParams, ESItemChangesMail>,
        | 'encryptedSearch'
        | 'highlightString'
        | 'highlightMetadata'
        | 'resumeIndexing'
        | 'isSearchResult'
        | 'esDelete'
        | 'getProgressRecorderRef'
        | 'shouldHighlight'
        | 'pauseIndexing'
        | 'cacheIndexedDB'
        | 'toggleEncryptedSearch'
    > {
    openDropdown: () => void;
    closeDropdown: () => void;
    setTemporaryToggleOff: () => void;
    getESDBStatus: () => ESDBStatusMail & ESDBStatus<ESMessage, NormalizedSearchParams>;
}

export interface ESMessage extends ESBaseMessage {
    decryptedBody?: string;
    decryptedSubject?: string;
    decryptionError: boolean;
}

export interface StoredCiphertext extends ESStoredItem, Pick<ESMessage, 'ID' | 'LabelIDs' | 'Time' | 'Order'> {}

export interface NormalizedSearchParams extends Omit<SearchParameters, 'wildcard' | 'keyword'> {
    labelID: string;
    sort: Sort;
    filter: Filter;
    search: SearchParameters;
    normalizedKeywords: string[] | undefined;
    decryptionError?: boolean;
}

export type ESItemChangesMail = Message & LabelIDsChanges;
