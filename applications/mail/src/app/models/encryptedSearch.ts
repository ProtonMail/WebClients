import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { EncryptedSearchFunctions, ESDBStatus, ESStoredItem } from '@proton/encrypted-search';
import { Element } from './element';
import { Filter, SearchParameters, Sort } from './tools';
import { LabelIDsChanges } from './event';

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

export interface ESDBStatusMail {
    dropdownOpened: boolean;
    temporaryToggleOff: boolean;
}

export interface EncryptedSearchFunctionsMail
    extends Pick<
        EncryptedSearchFunctions<ESMessage, ESItemChangesMail, NormalisedSearchParams>,
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
    getESDBStatus: () => ESDBStatusMail & ESDBStatus<ESMessage, NormalisedSearchParams>;
}

export interface ESMessage extends ESBaseMessage {
    decryptedBody?: string;
    decryptedSubject?: string;
    decryptionError: boolean;
}

export interface StoredCiphertext extends ESStoredItem, Pick<ESMessage, 'ID' | 'LabelIDs' | 'Time' | 'Order'> {}

export interface NormalisedSearchParams extends Omit<SearchParameters, 'wildcard' | 'keyword'> {
    labelID: string;
    sort: Sort;
    filter: Filter;
    search: SearchParameters;
    normalisedKeywords: string[] | undefined;
    decryptionError?: boolean;
}

export type ESItemChangesMail = Message & LabelIDsChanges;

export type ESSetsElementsCache = (Elements: Element[]) => void;
