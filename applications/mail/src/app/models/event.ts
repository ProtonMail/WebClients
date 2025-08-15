import type { EventLoop } from '@proton/account/eventLoop';
import type { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import type { Address, CHECKLIST_DISPLAY_TYPE, ChecklistKey, MailSettings } from '@proton/shared/lib/interfaces';
import type { LabelCount } from '@proton/shared/lib/interfaces/Label';
import type { Contact } from '@proton/shared/lib/interfaces/contacts';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import type { Conversation } from './conversation';

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
    BreachAlerts?: EventType[];
    MailSettings?: MailSettings;
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

export type IncomingDefaultEvent = Exclude<EventLoop['IncomingDefaults'], undefined>;

export type ElementEvent = ConversationEvent | MessageEvent;
