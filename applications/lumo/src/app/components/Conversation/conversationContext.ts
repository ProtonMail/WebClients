import type { ContextFilter } from '../../llm/contextFilter';
import type { Attachment, ConversationId, Message, MessageId, SpaceId } from '../../types';

export type ConversationContext = {
    spaceId: SpaceId;
    conversationId: ConversationId;
    allConversationAttachments: Attachment[];
    messageChain: Message[];
    contextFilters: ContextFilter[];
    /** Messages in this conversation only; used for shared-history compaction on edit forks. */
    messageMap?: Record<MessageId, Message>;
};
