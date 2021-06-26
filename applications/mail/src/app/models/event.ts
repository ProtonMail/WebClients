import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';
import { Contact } from 'proton-shared/lib/interfaces/contacts';
import { LabelCount } from 'proton-shared/lib/interfaces/Label';
import { Address } from 'proton-shared/lib/interfaces';
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
    EventID?: string;
    Refresh?: number;
    Conversations?: ConversationEvent[];
    Messages?: MessageEvent[];
    ConversationCounts?: LabelCount[];
    MessageCounts?: LabelCount[];
    Contacts?: ContactEvent[];
    Addresses?: AddressEvent[];
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

export interface AddressEvent extends EventType {
    Address?: Address;
}

export type ElementEvent = ConversationEvent | MessageEvent;
