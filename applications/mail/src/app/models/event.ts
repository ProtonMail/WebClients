import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import { Address, CHECKLIST_DISPLAY_TYPE, ChecklistKey, IncomingDefault } from '@proton/shared/lib/interfaces';
import { LabelCount } from '@proton/shared/lib/interfaces/Label';
import { Contact } from '@proton/shared/lib/interfaces/contacts';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';

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
    More?: 0 | 1;
    EventID?: string;
    Refresh?: number;
    Conversations?: ConversationEvent[];
    Messages?: MessageEvent[];
    ConversationCounts?: LabelCount[];
    MessageCounts?: LabelCount[];
    Contacts?: ContactEvent[];
    Addresses?: AddressEvent[];
    Checklist?: ChecklistEvent[];
    IncomingDefaults?: IncomingDefaultEvent[];
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

export interface ChecklistEvent extends EventType {
    CompletedItem: ChecklistKey;
    Display?: CHECKLIST_DISPLAY_TYPE;
}

export interface IncomingDefaultEvent extends EventType {
    IncomingDefault?: IncomingDefault;
}

export type ElementEvent = ConversationEvent | MessageEvent;
