import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';
import { Contact } from 'proton-shared/lib/interfaces/contacts';
import { Conversation } from './conversation';

interface EventType {
    ID: string;
    Action: EVENT_ACTIONS;
}

export interface LabelIDsChanges {
    LabelIDsAdded?: string[];
    LabelIDsRemoved?: string[];
    LabelIDs?: string[];
}

export interface Event {
    Conversations?: ConversationEvent[];
    Messages?: MessageEvent[];
    ConversationCounts?: ElementCountEvent[];
    MessageCounts?: ElementCountEvent[];
    Contacts?: ContactEvent[];
}

export interface ConversationEvent extends EventType {
    Conversation?: Conversation & LabelIDsChanges;
}

export interface MessageEvent extends EventType {
    Message?: Message & LabelIDsChanges;
}

export interface ContactEvent extends EventType {
    Contact?: Contact;
}

export type ElementEvent = ConversationEvent | MessageEvent;

export interface ElementCountEvent {
    LabelID: string;
    Total: number;
    Unread: number;
}
