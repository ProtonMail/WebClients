import type { SearchItem, ToolCallData, ToolResultData } from '../../../../../lib/toolCall/types';
import {
    isWebExtractToolCallData,
    isWebSearchToolCallData,
    isWebSourceToolResultData,
    tryParseToolCall,
    tryParseToolResult,
} from '../../../../../lib/toolCall/types';
import { findToolResultForCall } from '../../../../../messageHelpers';
import type { ContentBlock, ToolCallBlock, ToolResultBlock } from '../../../../../types';

/**
 * Parse and validate a tool call block.
 * Returns typed data if valid, null otherwise.
 */
export function parseToolCallBlock(block: ToolCallBlock): ToolCallData | null {
    // Try using pre-parsed data first
    if (block.toolCall) {
        const validated = tryParseToolCall(block.content);
        if (validated) return validated;
    }

    // Fallback to parsing the string
    return tryParseToolCall(block.content);
}

/**
 * Parse and validate a tool result block.
 * Returns typed data if valid, null otherwise.
 */
function parseToolResultBlock(block: ToolResultBlock): ToolResultData | null {
    // Try using pre-parsed data first
    if (block.toolResult) {
        const validated = tryParseToolResult(block.content);
        if (validated) return validated;
    }

    // Fallback to parsing the string
    return tryParseToolResult(block.content);
}

function isWebSourceToolCall(toolCall: ToolCallData): boolean {
    return isWebSearchToolCallData(toolCall) || isWebExtractToolCallData(toolCall);
}

/**
 * Extract search results from blocks (for sources button and panel).
 * Collects results from every web_search / web_extract tool call in the turn.
 */
export function extractSearchResults(blocks: ContentBlock[]): SearchItem[] | null {
    const allResults: SearchItem[] = [];
    const seenUrls = new Set<string>();

    for (const block of blocks) {
        if (block.type !== 'tool_call') continue;

        const toolCall = parseToolCallBlock(block);
        if (!toolCall || !isWebSourceToolCall(toolCall)) continue;

        const resultBlock = findToolResultForCall(blocks, block);
        if (!resultBlock) continue;

        const result = parseToolResultBlock(resultBlock);
        if (result && isWebSourceToolResultData(result)) {
            for (const item of result.results) {
                if (!seenUrls.has(item.url)) {
                    seenUrls.add(item.url);
                    allResults.push(item);
                }
            }
        }
    }

    return allResults.length > 0 ? allResults : null;
}
