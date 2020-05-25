import { Recipient } from './address';

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
    Labels?: ConversationLabel[];
    LabelIDs?: string[];
    Order?: number;
    NumAttachments?: number;
    ContextNumAttachments?: number;
    ExpirationTime?: number;
}

export interface ConversationLabel {
    ID: string;
    ContextNumMessages: number;
    ContextNumUnread: number;
    ContextTime: number;
    ContextSize: number;
    ContextNumAttachments: number;
}
