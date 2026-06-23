import { getMessageBlocks } from '../../messageHelpers';
import { type Message, Role } from '../../types';

function roleLabel(role: Role): string {
    switch (role) {
        case Role.User:
            return 'User';
        case Role.Assistant:
            return 'Assistant';
        case Role.System:
            return 'System';
        case Role.ToolCall:
            return 'Tool call';
        case Role.ToolResult:
            return 'Tool result';
        default:
            return 'Message';
    }
}

function blockText(block: ReturnType<typeof getMessageBlocks>[number]): string | undefined {
    switch (block.type) {
        case 'text':
            return block.content.trim() || undefined;
        case 'tool_call':
            return `[tool call] ${block.content}`.trim();
        case 'tool_result':
            return `[tool result] ${block.content}`.trim();
        default:
            return undefined;
    }
}

/**
 * Render an ordered list of messages into a plain-text transcript. Used both as
 * the input to the LLM summarizer and, when summarization is not required, as
 * the condensed replacement text itself.
 */
export function buildTranscript(messages: Message[]): string {
    const parts: string[] = [];
    for (const message of messages) {
        const label = roleLabel(message.role);
        const lines = getMessageBlocks(message)
            .map(blockText)
            .filter((t): t is string => !!t);
        const ctx = message.context?.trim();
        if (ctx) {
            lines.push(`[context] ${ctx}`);
        }
        if (lines.length === 0) {
            continue;
        }
        parts.push(`${label}: ${lines.join('\n')}`);
    }
    return parts.join('\n\n');
}
