import { getMessageBlocks } from '../../messageHelpers';
import type { Attachment, Message } from '../../types';
import { Role } from '../../types-api';

/**
 * The material a deck's numbers may come from: what the user wrote, the files they attached, and
 * tool results such as web search, up to and including the message that made this version.
 * The model's own replies are left out: a number it wrote earlier is not a source.
 */
export const collectDeckSourceText = (
    chain: Message[],
    attachments: Record<string, Attachment | undefined>,
    untilMessageId?: string
): string => {
    const parts: string[] = [];
    for (const message of chain) {
        if (message.role === Role.User) {
            parts.push(message.content ?? '');
            for (const attachment of message.attachments ?? []) {
                parts.push(attachments[attachment.id]?.markdown ?? '');
            }
        }
        for (const block of getMessageBlocks(message)) {
            if (block.type === 'tool_result') {
                parts.push(block.content);
            }
        }
        if (message.id === untilMessageId) {
            break;
        }
    }
    return parts.filter(Boolean).join('\n');
};
