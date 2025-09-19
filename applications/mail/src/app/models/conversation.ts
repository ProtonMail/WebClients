import type { MIME_TYPES } from '@proton/shared/lib/constants';
import type { Recipient } from '@proton/shared/lib/interfaces/Address';
import type { AttachmentInfo, AttachmentsMetadata } from '@proton/shared/lib/interfaces/mail/Message';

export interface Conversation {
    ID: string;
    Subject?: string;
    Size?: number;
    Time?: number;
    ContextTime?: number;
    NumUnread?: number;
    NumMessages?: number;
    Senders?: Recipient[];
    Recipients?: Recipient[];
    ContextNumUnread?: number;
    ContextNumMessages?: number;
    Labels?: ConversationLabel[];
    Order?: number;
    NumAttachments?: number;
    ContextNumAttachments?: number;
    ExpirationTime?: number;
    /** Only present in metadata call. Mot present in conversations/ID call */
    ContextExpirationTime?: number;
    AttachmentInfo?: { [key in MIME_TYPES]?: AttachmentInfo };
    AttachmentsMetadata?: AttachmentsMetadata[];
    DisplaySnoozedReminder?: boolean;
    ExpiringByRetention?: boolean;
}

export interface ConversationLabel {
    ID: string;
    ContextNumMessages?: number;
    ContextNumUnread?: number;
    ContextTime?: number;
    ContextExpirationTime?: number;
    ContextSize?: number;
    ContextNumAttachments?: number;
    ContextSnoozeTime?: number;
}
