import type { ChatCompletionsRequest } from '@proton/lumo-api-client/core/types';

import type { ConversationId, MessageId } from '../../types';

const MAX_RECORDS = 5;

// Plaintext conversation content: memory only, never persisted, logged or sent anywhere except an explicit feedback.
const lastRequests = new Map<ConversationId, { messageId: MessageId; body: ChatCompletionsRequest }>();

export function recordLastRequest(conversationId: ConversationId, messageId: MessageId, body: ChatCompletionsRequest) {
    // Re-inserting moves the conversation to the back of the Map's insertion order, so eviction drops the oldest write.
    lastRequests.delete(conversationId);
    lastRequests.set(conversationId, { messageId, body });

    // Simple FIFO cache to reduce memory usage.
    if (lastRequests.size > MAX_RECORDS) {
        const [oldest] = lastRequests.keys();
        lastRequests.delete(oldest);
    }
}

export function getLastRequestForMessage(
    conversationId: ConversationId,
    messageId: MessageId
): ChatCompletionsRequest | undefined {
    const entry = lastRequests.get(conversationId);
    return entry?.messageId === messageId ? entry.body : undefined;
}
