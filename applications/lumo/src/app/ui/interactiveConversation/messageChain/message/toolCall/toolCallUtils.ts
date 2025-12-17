import type { SearchItem, ToolCallData, ToolResultData } from '../../../../../lib/toolCall/types';
import {
    isToolResultError,
    isWebSearchToolCallData,
    isWebSearchToolResultData,
    tryParseToolCall,
    tryParseToolResult,
} from '../../../../../lib/toolCall/types';
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

/**
 * Extract search results from blocks (for legacy sources button).
 * Finds the first web_search tool call and its corresponding result.
 */
export function extractSearchResults(blocks: ContentBlock[]): SearchItem[] | null {
    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        if (block.type !== 'tool_call') continue;

        const toolCall = parseToolCallBlock(block);
        if (toolCall?.name !== 'web_search') continue;

        // Find corresponding result after this tool call
        for (let j = i + 1; j < blocks.length; j++) {
            const resultBlock = blocks[j];
            if (resultBlock.type !== 'tool_result') continue;

            const result = parseToolResultBlock(resultBlock);
            if (result && isWebSearchToolResultData(result)) {
                return result.results;
            }
            break; // Found a result block, stop looking
        }
    }
    return null;
}
