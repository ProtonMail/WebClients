import { Message } from './message';
import { Conversation } from './conversation';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';

interface EventType {
    ID: string;
    Action: EVENT_ACTIONS;
}

export interface LabelIDsChanges {
    LabelIDsAdded?: string[];
    LabelIDsRemoved?: string[];
}

export interface Event {
    Conversations?: ConversationEvent[];
    Messages?: MessageEvent[];
    ConversationCounts?: ElementCountEvent[];
    MessageCounts?: ElementCountEvent[];
}

export interface ConversationEvent extends EventType {
    Conversation: Conversation & LabelIDsChanges;
}

export interface MessageEvent extends EventType {
    Message: Message & LabelIDsChanges;
}

export type ElementEvent = ConversationEvent | MessageEvent;

export interface ElementCountEvent {
    LabelID: string;
    Total: number;
    Unread: number;
}
