import type { SearchItem, ToolCallData, ToolResultData } from '../../../../../lib/toolCall/types';
import {
    isToolResultError,
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
export function parseToolResultBlock(block: ToolResultBlock): ToolResultData | null {
    // Try using pre-parsed data first
    if (block.toolResult) {
        const validated = tryParseToolResult(block.content);
        if (validated) return validated;
    }

    // Fallback to parsing the string
    return tryParseToolResult(block.content);
}

/**
 * Check if a tool result indicates an error.
 */
export function isToolResultErrorBlock(block: ToolResultBlock): boolean {
    const parsed = parseToolResultBlock(block);
    return parsed ? isToolResultError(parsed) : false;
}

/**
 * Get human-readable error message for a tool call.
 */
export function getToolCallErrorMessage(toolCall: ToolCallData): string {
    if (isWebSearchToolCallData(toolCall)) {
        return `Error while searching for: ${toolCall.arguments.query}`;
    }

    switch (toolCall.name) {
        case 'weather':
            return `Error while checking weather`;
        case 'stock':
            return `Error while looking up stock prices`;
        case 'cryptocurrency':
            return `Error while checking cryptocurrency prices`;
        case 'describe_image':
            return `Error while describing image`;
        case 'generate_image':
            return `Error while generating image`;
        case 'edit_image':
            return `Error while editing image`;
        case 'proton_info':
            return `Error while checking Proton knowledge`;
        default:
            return 'Error while executing tool';
    }
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
