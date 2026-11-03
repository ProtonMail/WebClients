import {
    READ_KNOWLEDGE_TOOL_NAME,
    SEARCH_KNOWLEDGE_TOOL_NAME,
} from '../../../../../../features/client-tools/retrievalTool/schema';

/** Results listed per search, so a long result list stays readable. */
const MAX_LISTED_RESULTS = 6;

export type KnowledgeItem =
    | { kind: 'chat'; title?: string; date?: string; messageId?: string; inThisChat: boolean }
    | { kind: 'file'; name: string; page?: number; pages?: number };

/** What a knowledge lookup searched for and found. Never the snippets themselves. */
export type KnowledgeStepDetails = {
    query?: string;
    items: KnowledgeItem[];
    /** Found but not listed. */
    more: number;
    /** The search ran and found nothing. */
    noMatches: boolean;
    /** A read of a chat message rather than of a file. */
    readsChat: boolean;
};

const parseObject = (value: unknown): Record<string, unknown> | undefined => {
    try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : undefined;
    } catch {
        return undefined;
    }
};

const asText = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : undefined);
const asNumber = (value: unknown) => (typeof value === 'number' ? value : undefined);

function toItem(result: Record<string, unknown>, kind: unknown): KnowledgeItem | undefined {
    if (kind === 'file') {
        const name = asText(result.file_name);
        return name ? { kind: 'file', name, page: asNumber(result.page), pages: asNumber(result.pages) } : undefined;
    }
    if (kind === 'message') {
        const inThisChat = result.in_this_chat === true;
        return {
            kind: 'chat',
            title: asText(result.chat_title),
            date: asText(result.date),
            messageId: inThisChat ? undefined : asText(result.message_id),
            inThisChat,
        };
    }
    return undefined;
}

const itemKey = (item: KnowledgeItem) =>
    item.kind === 'file'
        ? `file:${item.name}:${item.page}`
        : `chat:${item.inThisChat ? '' : (item.title ?? '')}:${item.date}`;

export function getKnowledgeStepDetails(
    name: string,
    rawArguments: unknown,
    rawResult: string | undefined
): KnowledgeStepDetails {
    const args = parseObject(rawArguments);
    const result = parseObject(rawResult);
    const details: KnowledgeStepDetails = {
        items: [],
        more: 0,
        noMatches: false,
        readsChat: name === READ_KNOWLEDGE_TOOL_NAME && !!asText(args?.message_id),
    };

    if (name === SEARCH_KNOWLEDGE_TOOL_NAME) {
        details.query = asText(args?.query);
        if (result?.ok === true && Array.isArray(result.results)) {
            const seen = new Set<string>();
            const found = (result.results as unknown[])
                .map((entry) => {
                    const object = parseObject(entry);
                    return object ? toItem(object, object.type) : undefined;
                })
                .filter((item): item is KnowledgeItem => {
                    if (!item || seen.has(itemKey(item))) {
                        return false;
                    }
                    seen.add(itemKey(item));
                    return true;
                });
            details.items = found.slice(0, MAX_LISTED_RESULTS);
            details.more = Math.max(0, found.length - MAX_LISTED_RESULTS);
            details.noMatches = found.length === 0;
        }
    }

    if (name === READ_KNOWLEDGE_TOOL_NAME && result?.ok === true) {
        const item = toItem(result, asText(result.file_name) ? 'file' : asText(result.message_id) ? 'message' : null);
        if (item) {
            details.items = [item];
            details.readsChat = item.kind === 'chat';
        }
    }
    return details;
}
