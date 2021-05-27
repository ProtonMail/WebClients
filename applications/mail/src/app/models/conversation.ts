import { Recipient } from 'proton-shared/lib/interfaces/Address';
import { Message } from 'proton-shared/lib/interfaces/mail/Message';

export interface Conversation {
    ID?: string;
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
}

export interface ConversationLabel {
    ID: string;
    ContextNumMessages?: number;
    ContextNumUnread?: number;
    ContextTime?: number;
    ContextSize?: number;
    ContextNumAttachments?: number;
}

export interface ConversationResult {
    Conversation: Conversation;
    Messages?: Message[];
}

export interface ConversationErrors {
    network?: Error[];
    unknown?: Error[];
}

export interface ConversationCacheEntry {
    Conversation?: Conversation;
    Messages?: Message[];
    loadRetry: number;
    errors: ConversationErrors;
}
