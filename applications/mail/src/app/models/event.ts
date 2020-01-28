import { Message } from './message';
import { Conversation } from './conversation';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';

export interface Event {
    Conversations?: ConversationEvent[];
    Messages?: MessageEvent[];
    ConversationCounts?: ElementCountEvent[];
    MessageCounts?: ElementCountEvent[];
}

export interface ConversationEvent {
    ID: string;
    Conversation: Conversation;
    Action: EVENT_ACTIONS;
}

export interface MessageEvent {
    ID: string;
    Message: Message;
    Action: EVENT_ACTIONS;
}

export type ElementEvent = ConversationEvent | MessageEvent;

export interface ElementCountEvent {
    LabelID: string;
    Total: number;
    Unread: number;
}
