import type { EventLoop } from '@proton/account/eventLoop';
import type { ConversationEvent, EventType, MessageEvent } from '@proton/mail-message/models/event';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import type { CHECKLIST_DISPLAY_TYPE, ChecklistKey } from '@proton/shared/lib/interfaces/Checklist';
import type { LabelCount } from '@proton/shared/lib/interfaces/Label';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';
import type { Contact } from '@proton/shared/lib/interfaces/contacts/Contact';

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
