import type { Message, MessageId } from '../../types';

/** Message ids folded into a compaction summary and no longer sent to the model. */
export function getSummarizedMessageIds(messageChain: Message[]): Set<MessageId> {
    const ids = new Set<MessageId>();
    for (const message of messageChain) {
        message.compaction?.summarizedMessageIds.forEach((id) => ids.add(id));
    }
    return ids;
}

export function isSummarizedMessage(messageId: MessageId, messageChain: Message[]): boolean {
    return getSummarizedMessageIds(messageChain).has(messageId);
}
