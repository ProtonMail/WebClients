import type { ToolCallData, ToolResultData } from '../../../../../lib/toolCall/types';
import { isToolResultError, tryParseToolCall, tryParseToolResult } from '../../../../../lib/toolCall/types';
import { getMessageToolCalls, getMessageToolResults } from '../../../../../messageHelpers';
import type { Message } from '../../../../../types';

export interface ToolCallInfoResult {
    toolCall: ToolCallData | null;
    hasError: boolean;
    toolResult: ToolResultData | null;
    errorMessage?: string;
}

// FIXME: now fully incorrect with the blocks structure (message v2), fix this function and the call sites entirely
export const useToolCallInfo = (message: Message): ToolCallInfoResult => {
    // Get tool calls and results using helper functions
    const toolCallBlocks = getMessageToolCalls(message);
    const toolResultBlocks = getMessageToolResults(message);

    // For now, use the first tool call (backward compat)
    const toolCallContent = toolCallBlocks.length > 0 ? toolCallBlocks[0].content : undefined;
    const toolResultContent = toolResultBlocks.length > 0 ? toolResultBlocks[0].content : undefined;

    console.log('useToolCallInfo: toolCall = ', toolCallContent);
    console.log('useToolCallInfo: toolResult = ', toolResultContent);

    if (!toolCallContent) {
        return { toolCall: null, hasError: false, toolResult: null };
    }

    const parsedToolCall = tryParseToolCall(toolCallContent);
    if (!parsedToolCall) {
        return { toolCall: null, hasError: false, toolResult: null };
    }

    // If we have a toolCall but no toolResult yet, show the toolCall
    if (!toolResultContent) {
        return { toolCall: parsedToolCall, hasError: false, toolResult: null };
    }

    const parsedToolResult = tryParseToolResult(toolResultContent);
    if (!parsedToolResult) {
        return { toolCall: parsedToolCall, hasError: false, toolResult: null };
    }

    if (isToolResultError(parsedToolResult)) {
        const errorMessage = getErrorMessage(parsedToolCall);
        return {
            toolCall: parsedToolCall,
            hasError: true,
            toolResult: parsedToolResult,
            errorMessage,
        };
    }

    return {
        toolCall: parsedToolCall,
        hasError: false,
        toolResult: parsedToolResult,
    };
};

function getErrorMessage(toolCall: ToolCallData): string {
    switch (toolCall.name) {
        case 'web_search':
            return `Error while searching for: ${toolCall.arguments.query}`;
        case 'describe_image':
            return `Error while describing image: ${toolCall.arguments.image_id}`;
        case 'generate_image':
            return `Error while generating image`;
        default:
            return 'Error while executing tool';
    }
}
