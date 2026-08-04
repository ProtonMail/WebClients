import type { ContextFilter } from '../../llm/contextFilter';
import type { Attachment, ConversationId, Message, SpaceId } from '../../types';

export type ConversationContext = {
    spaceId: SpaceId;
    conversationId: ConversationId;
    allConversationAttachments: Attachment[];
    messageChain: Message[];
    contextFilters: ContextFilter[];
};
