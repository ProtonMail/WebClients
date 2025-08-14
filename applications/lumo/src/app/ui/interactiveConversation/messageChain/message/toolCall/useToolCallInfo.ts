import type { SearchItem } from '../../../../../lib/toolCall/types';
import { isToolResultError, tryParseToolCall, tryParseToolResult } from '../../../../../lib/toolCall/types';

export interface ToolCallInfoResult {
    query: string | null;
    hasError: boolean;
    results: SearchItem[] | null;
    errorMessage?: string;
}

export const useToolCallInfo = (toolCall: string | undefined, toolResult: string | undefined): ToolCallInfoResult => {
    if (!toolCall || !toolResult) {
        return { query: null, hasError: false, results: null };
    }

    const parsedToolCall = tryParseToolCall(toolCall);
    const query = parsedToolCall?.arguments.query;
    if (!query) {
        return { query: null, hasError: false, results: null };
    }

    const parsedToolResult = tryParseToolResult(toolResult);
    if (!parsedToolResult) {
        return { query, hasError: false, results: null };
    }

    if (isToolResultError(parsedToolResult)) {
        return {
            query,
            hasError: true,
            results: null,
            errorMessage: `Error while searching for: ${query}`,
        };
    }

    const results = parsedToolResult.results;

    if (!results || results.length === 0) {
        return { query, hasError: false, results: null };
    }

    return {
        query,
        hasError: false,
        results,
    };
};
