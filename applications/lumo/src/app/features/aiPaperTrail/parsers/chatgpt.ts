import type { NormalizedConversation, NormalizedExport } from './types';

interface ChatGptContent {
    content_type?: string;
    parts?: unknown[];
}

interface ChatGptMessage {
    author?: { role?: string };
    content?: ChatGptContent;
    create_time?: number | null;
}

interface ChatGptNode {
    message?: ChatGptMessage | null;
}

export interface ChatGptConversation {
    title?: string;
    create_time?: number | null;
    mapping?: Record<string, ChatGptNode>;
}

/**
 * ChatGPT exports `conversations.json` as an array of conversations, each holding a
 * `mapping` graph of message nodes keyed by id (not ordered).
 */
export const isChatGptExport = (data: unknown): data is ChatGptConversation[] => {
    return (
        Array.isArray(data) &&
        data.some((item) => item !== null && typeof item === 'object' && 'mapping' in (item as object))
    );
};

const extractText = (content: ChatGptContent | undefined): string => {
    if (!content || !Array.isArray(content.parts)) {
        return '';
    }
    // `parts` mixes plain strings (text) with objects (e.g. image refs); keep text only.
    return content.parts
        .filter((part): part is string => typeof part === 'string')
        .join('\n')
        .trim();
};

const isTextContent = (content: ChatGptContent | undefined): boolean => {
    const type = content?.content_type;
    return !type || type === 'text' || type === 'multimodal_text';
};

export const parseChatGptExport = (data: ChatGptConversation[]): NormalizedExport => {
    const conversations: NormalizedConversation[] = [];

    for (const convo of data) {
        if (!convo || typeof convo !== 'object') {
            continue;
        }
        const mapping = convo.mapping ?? {};

        const prompts: { text: string; order: number }[] = [];
        for (const node of Object.values(mapping)) {
            const message = node?.message;
            if (!message || message.author?.role !== 'user' || !isTextContent(message.content)) {
                continue;
            }
            const text = extractText(message.content);
            if (text) {
                prompts.push({ text, order: typeof message.create_time === 'number' ? message.create_time : 0 });
            }
        }

        if (prompts.length > 0) {
            prompts.sort((a, b) => a.order - b.order);
            conversations.push({
                title: convo.title?.trim() || 'Untitled',
                userPrompts: prompts.map((p) => p.text),
                createdAt: typeof convo.create_time === 'number' ? convo.create_time : undefined,
            });
        }
    }

    return { source: 'chatgpt', conversations };
};
