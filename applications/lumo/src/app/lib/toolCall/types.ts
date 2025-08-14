export type ToolCallData = WebSearchToolCallData;

export function isToolCallData(data: unknown): data is ToolCallData {
    return isWebSearchToolCallData(data);
}

export type WebSearchToolCallData = { name: 'web_search'; arguments: WebSearchArguments };

export function isWebSearchToolCallData(data: unknown): data is WebSearchToolCallData {
    // prettier-ignore
    return (
        typeof data === 'object' &&
        data !== null &&
        ('name' in data &&
            data.name === 'web_search') &&
        ('arguments' in data &&
            isWebSearchArguments(data.arguments))
    );
}

export type WebSearchArguments = {
    query: string;
};

export function isWebSearchArguments(args: unknown): args is WebSearchToolCallData {
    // prettier-ignore
    return (
        typeof args === 'object' &&
        args !== null &&
        ('query' in args &&
            typeof args.query === 'string')
    );
}

export type ToolResultData = WebSearchToolResultData | ToolResultError;

export function isToolResultData(data: unknown): data is ToolResultData {
    return isWebSearchToolResultData(data) || isToolResultError(data);
}

export type WebSearchToolResultData = {
    results: SearchItem[];
};

export function isWebSearchToolResultData(data: unknown): data is WebSearchToolResultData {
    // prettier-ignore
    return (
        typeof data === 'object' &&
        data !== null &&
        ('results' in data &&
            Array.isArray(data.results) &&
            data.results.every((item) => isSearchItem(item)))
    );
}

export type SearchItem = {
    title: string;
    description?: string;
    url: string;
    extra_snippets?: string[];
};

export function isSearchItem(item: unknown): item is SearchItem {
    return (
        typeof item === 'object' &&
        item !== null &&
        'title' in item &&
        typeof item.title === 'string' &&
        (!('description' in item) || item.description === undefined || typeof item.description === 'string') &&
        'url' in item &&
        typeof item.url === 'string' &&
        (!('extra_snippets' in item) ||
            item.extra_snippets === undefined ||
            (Array.isArray(item.extra_snippets) && item.extra_snippets.every((snippet) => typeof snippet === 'string')))
    );
}

export type ToolResultError = {
    error: boolean;
};

export function isToolResultError(data: unknown): data is ToolResultError {
    return typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'boolean';
}

export function tryParseToolCall(toolCall: string): ToolCallData | null {
    if (!toolCall) {
        return null;
    }
    try {
        // console.log(toolCall);
        const parsed = JSON.parse(toolCall);
        return isToolCallData(parsed) ? parsed : null;
    } catch (e) {
        return null;
    }
}

export function tryParseToolResult(toolCall: string): ToolResultData | null {
    if (!toolCall) {
        return null;
    }
    try {
        const parsed = JSON.parse(toolCall);
        return isToolResultData(parsed) ? parsed : null;
    } catch (e) {
        return null;
    }
}
