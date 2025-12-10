import type { ToolCallData, ToolResultData } from '../../../../../lib/toolCall/types';
import { isToolResultError, tryParseToolCall, tryParseToolResult } from '../../../../../lib/toolCall/types';

export interface ToolCallInfoResult {
    toolCall: ToolCallData | null;
    hasError: boolean;
    toolResult: ToolResultData | null;
    errorMessage?: string;
}

export const useToolCallInfo = (toolCall: string | undefined, toolResult: string | undefined): ToolCallInfoResult => {
    console.log('useToolCallInfo: toolCall = ', toolCall);
    console.log('useToolCallInfo: toolResult = ', toolResult);

    if (!toolCall || !toolResult) {
        return { toolCall: null, hasError: false, toolResult: null };
    }

    const parsedToolCall = tryParseToolCall(toolCall);
    if (!parsedToolCall) {
        return { toolCall: null, hasError: false, toolResult: null };
    }

    const parsedToolResult = tryParseToolResult(toolResult);
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
