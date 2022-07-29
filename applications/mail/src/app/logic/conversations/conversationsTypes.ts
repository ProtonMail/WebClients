import { Api, SimpleMap } from '@proton/shared/lib/interfaces';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { Conversation } from '../../models/conversation';

export interface ConversationResult {
    Conversation: Conversation;
    Messages?: Message[];
}

export interface ConversationParams {
    api: Api;
    conversationID: string;
    messageID: string | undefined;
}

export interface ConversationErrors {
    network?: Error[];
    notExist?: Error[];
    unknown?: Error[];
}

export interface ConversationEvent {
    toCreate: Message[];
    toUpdate: Message[];
    toDelete: { [ID: string]: boolean };
}

export interface ConversationState {
    Conversation: Conversation;
    Messages?: Message[];
    loadRetry: number;
    errors: ConversationErrors;
}

export type ConversationsState = SimpleMap<ConversationState>;
