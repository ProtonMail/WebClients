import { Message } from './message';
import { Conversation } from './conversation';

interface EventType {
    ID: string;
    Action: number;
}

interface LabelIDsChanges {
    LabelIDsAdded?: string[];
    LabelIDsRemoved?: string[];
}

export interface Event {
    Messages?: MessageEvent[];
    Conversations?: ConversationEvent[];
}

export interface MessageEvent extends EventType {
    Message: Message & LabelIDsChanges;
}

export interface ConversationEvent extends EventType {
    Conversation: Conversation & LabelIDsChanges;
}
