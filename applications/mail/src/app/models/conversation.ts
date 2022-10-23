import { MIME_TYPES } from '@proton/shared/lib/constants';
import { Recipient } from '@proton/shared/lib/interfaces/Address';
import { AttachmentInfo } from '@proton/shared/lib/interfaces/mail/Message';

export interface Conversation {
    ID: string;
    DisplaySenderImage?: number;
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
    AttachmentInfo?: { [key in MIME_TYPES]?: AttachmentInfo };
    BimiSelector?: string | null;
}

export interface ConversationLabel {
    ID: string;
    ContextNumMessages?: number;
    ContextNumUnread?: number;
    ContextTime?: number;
    ContextSize?: number;
    ContextNumAttachments?: number;
}
