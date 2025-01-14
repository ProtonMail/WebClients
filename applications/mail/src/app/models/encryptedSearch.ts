import type { ESItem, ESStatus, EncryptedSearchFunctions } from '@proton/encrypted-search';
import type { NormalizedSearchParams } from '@proton/encrypted-search/lib/models/mail';
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

export type ESMessage = ESItem<ESBaseMessage, ESMessageContent>;

export type MetadataRecoveryPoint = {
    End?: number;
    EndID?: string;
};
