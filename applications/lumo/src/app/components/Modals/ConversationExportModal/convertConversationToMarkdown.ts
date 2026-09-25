import { getMessageContent } from '../../../messageHelpers';
import type { MessageMap } from '../../../redux/slices/core/messages';
import type { Conversation } from '../../../types';

/**
 * Converts a Lumo conversation into a markdown transcript: the title, followed by each non-placeholder message in
 * chronological order as a bold, uppercased `**ROLE:**` label, then the message's markdown content.
 */
export const convertConversationToMarkdown = (conversation: Conversation, messages: MessageMap): string => {
    const lines = [conversation.title, '='.repeat(conversation.title.length)];
    const sortedMessages = Object.values(messages)
        .filter((message) => !message.placeholder)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    for (const message of sortedMessages) {
        lines.push('', `**${message.role.toUpperCase()}:**`, getMessageContent(message));
    }

    return lines.join('\n');
};
