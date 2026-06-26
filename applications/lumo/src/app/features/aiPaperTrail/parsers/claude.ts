import type { NormalizedConversation, NormalizedExport } from './types';

interface ClaudeContentBlock {
    type?: string;
    text?: string;
}

interface ClaudeMessage {
    sender?: string;
    text?: string;
    content?: ClaudeContentBlock[];
    created_at?: string;
}

export interface ClaudeConversation {
    name?: string;
    created_at?: string;
    chat_messages?: ClaudeMessage[];
    messages?: ClaudeMessage[];
}

/**
 * Claude exports `conversations.json` as an array of conversations, each with a
 * `chat_messages` (older exports: `messages`) array. The user is the `human` sender.
 */
export const isClaudeExport = (data: unknown): data is ClaudeConversation[] => {
    return (
        Array.isArray(data) &&
        data.some(
            (item) =>
                item !== null &&
                typeof item === 'object' &&
                ('chat_messages' in (item as object) || 'messages' in (item as object))
        )
    );
};

const extractText = (message: ClaudeMessage): string => {
    if (typeof message.text === 'string' && message.text.trim()) {
        return message.text.trim();
    }
    if (Array.isArray(message.content)) {
        return message.content
            .filter((block) => (!block.type || block.type === 'text') && typeof block.text === 'string')
            .map((block) => block.text as string)
            .join('\n')
            .trim();
    }
    return '';
};

const parseTimestamp = (value?: string): number | undefined => {
    if (!value) {
        return undefined;
    }
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? undefined : Math.floor(ms / 1000);
};

export const parseClaudeExport = (data: ClaudeConversation[]): NormalizedExport => {
    const conversations: NormalizedConversation[] = [];

    for (const convo of data) {
        if (!convo || typeof convo !== 'object') {
            continue;
        }
        const messages = convo.chat_messages ?? convo.messages ?? [];

        const userPrompts: string[] = [];
        for (const message of messages) {
            if (message?.sender !== 'human') {
                continue;
            }
            const text = extractText(message);
            if (text) {
                userPrompts.push(text);
            }
        }

        if (userPrompts.length > 0) {
            conversations.push({
                title: convo.name?.trim() || 'Untitled',
                userPrompts,
                createdAt: parseTimestamp(convo.created_at),
            });
        }
    }

    return { source: 'claude', conversations };
};
