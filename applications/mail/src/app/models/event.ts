import type { EventLoop } from '@proton/account/eventLoop';
import type { Conversation } from '@proton/mail-message/models/conversation';
import type { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import type { CHECKLIST_DISPLAY_TYPE, ChecklistKey } from '@proton/shared/lib/interfaces/Checklist';
import type { LabelCount } from '@proton/shared/lib/interfaces/Label';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';
import type { Contact } from '@proton/shared/lib/interfaces/contacts/Contact';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

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

interface ContactEvent extends EventType {
    Contact?: Contact;
}

interface AddressEvent extends EventType {
    Address?: Address;
}

interface ChecklistEvent extends EventType {
    CompletedItem: ChecklistKey;
    Display?: CHECKLIST_DISPLAY_TYPE;
}

export type IncomingDefaultEvent = Exclude<EventLoop['IncomingDefaults'], undefined>;
