import type { ContentBlock, Message, TextBlock, ToolCallBlock, ToolResultBlock } from './types';
import { isTextBlock, isToolCallBlock, isToolResultBlock } from './types';

/**
 * Try to parse JSON, returning the parsed value or undefined on failure.
 * Does not validate the structure.
 */
function tryParseJSON(jsonString: string): unknown {
    try {
        return JSON.parse(jsonString);
    } catch {
        return undefined;
    }
}

/**
 * Get message text content as a single string.
 * This omits the tool calls, though, so use only if you need flat text in a "lossy" way ie without the tool calls
 */
export function getMessageContent(message: Message): string {
    // V2
    if (message.blocks?.length) {
        return message.blocks
            .filter(isTextBlock)
            .map((b) => b.content)
            .join('\n\n');
    }
    // V1
    return message.content || '';
}

/**
 * Get message blocks array.
 * Constructs from legacy fields if blocks don't exist.
 * Parses JSON for tool calls and tool results (best effort, no validation).
 */
export function getMessageBlocks(message: Message): ContentBlock[] {
    // V2
    if (message.blocks) {
        return message.blocks;
    }

    // V1: Construct from legacy fields
    const blocks: ContentBlock[] = [];
    if (message.toolCall) {
        blocks.push({
            type: 'tool_call',
            content: message.toolCall,
            toolCall: tryParseJSON(message.toolCall),
        });
    }
    if (message.toolResult) {
        blocks.push({
            type: 'tool_result',
            content: message.toolResult,
            toolResult: tryParseJSON(message.toolResult),
        });
    }
    if (message.content) {
        blocks.push({ type: 'text', content: message.content });
    }
    return blocks;
}

/**
 * Get all tool call blocks from message.
 */
export function getMessageToolCalls(message: Message): ToolCallBlock[] {
    return getMessageBlocks(message).filter(isToolCallBlock);
}

/**
 * Get all tool result blocks from message.
 */
export function getMessageToolResults(message: Message): ToolResultBlock[] {
    return getMessageBlocks(message).filter(isToolResultBlock);
}

/**
 * Check if message has any text content.
 */
export function hasMessageContent(message: Message): boolean {
    const blocks = getMessageBlocks(message);
    return blocks.some((b) => isTextBlock(b) && b.content.trim().length > 0);
}

/**
 * Append text content to blocks array.
 * Appends to latest text block if it exists, otherwise creates new one.
 */
export function appendTextToBlocks(blocks: ContentBlock[], text: string): ContentBlock[] {
    if (blocks.length === 0 || blocks[blocks.length - 1].type !== 'text') {
        // No text block at end, create new one
        return [...blocks, { type: 'text', content: text }];
    }

    // Append to last text block
    const lastBlock = blocks[blocks.length - 1] as TextBlock;
    return [...blocks.slice(0, -1), { ...lastBlock, content: lastBlock.content + text }];
}

/**
 * Check if two parsed tool calls have the same name.
 * Used to determine if a streaming tool call should replace the previous one.
 */
function haveSameName(parsedToolCall1: unknown, parsedToolCall2: unknown): boolean {
    if (
        typeof parsedToolCall1 === 'object' &&
        parsedToolCall1 !== null &&
        typeof parsedToolCall2 === 'object' &&
        parsedToolCall2 !== null
    ) {
        const obj1 = parsedToolCall1 as any;
        const obj2 = parsedToolCall2 as any;
        return (
            'name' in obj1 &&
            typeof obj1.name === 'string' &&
            'name' in obj2 &&
            typeof obj2.name === 'string' &&
            obj1.name === obj2.name
        );
    }
    return false;
}

/**
 * Set tool call in blocks array.
 * Replaces last tool_call block if it exists and has the same name (streaming behavior),
 * otherwise appends new block.
 */
export function setToolCallInBlocks(blocks: ContentBlock[], toolCall: string): ContentBlock[] {
    const newParsed = tryParseJSON(toolCall);

    // Check if last block is a tool_call with the same name
    if (blocks.length > 0) {
        const lastBlock = blocks[blocks.length - 1];
        if (isToolCallBlock(lastBlock) && haveSameName(lastBlock.toolCall, newParsed)) {
            // Replace the last tool_call block (streaming tool call arguments)
            return [...blocks.slice(0, -1), { type: 'tool_call', content: toolCall, toolCall: newParsed }];
        }
    }

    // No matching tool_call at end, append new one
    return [...blocks, { type: 'tool_call', content: toolCall, toolCall: newParsed }];
}

/**
 * Set tool result in blocks array.
 * Replaces last tool_result block if it exists (streaming behavior),
 * otherwise appends new block.
 */
export function setToolResultInBlocks(blocks: ContentBlock[], toolResult: string): ContentBlock[] {
    // Check if last block is a tool_result
    if (blocks.length > 0 && blocks[blocks.length - 1].type === 'tool_result') {
        // Replace the last tool_result block (streaming tool result)
        return [
            ...blocks.slice(0, -1),
            { type: 'tool_result', content: toolResult, toolResult: tryParseJSON(toolResult) },
        ];
    }

    // No tool_result at end, append new one
    return [...blocks, { type: 'tool_result', content: toolResult, toolResult: tryParseJSON(toolResult) }];
}

/**
 * Add a tool call block with optional ID.
 */
export function addToolCallBlock(blocks: ContentBlock[], toolCall: string, id?: string): ContentBlock[] {
    return [
        ...blocks,
        {
            type: 'tool_call',
            content: toolCall,
            toolCall: tryParseJSON(toolCall),
            ...(id && { id }),
        },
    ];
}

/**
 * Add a tool result block with optional tool_call_id.
 */
export function addToolResultBlock(blocks: ContentBlock[], toolResult: string, toolCallId?: string): ContentBlock[] {
    return [
        ...blocks,
        {
            type: 'tool_result',
            content: toolResult,
            toolResult: tryParseJSON(toolResult),
            ...(toolCallId && { tool_call_id: toolCallId }),
        },
    ];
}

// ============================================================================
// Message Equality Functions (for memoization)
// ============================================================================

/**
 * Check if message content has changed (for rendering).
 * Uses reference equality for blocks and string equality for legacy fields.
 * This is fast and sufficient since blocks array is replaced on each update.
 */
export function messageContentEqual(a: Message, b: Message): boolean {
    return (
        a.content === b.content &&
        a.toolCall === b.toolCall && // String comparison (cheap)
        a.toolResult === b.toolResult && // String comparison (cheap)
        a.blocks === b.blocks && // Reference equality (cheap, blocks array replaced on update)
        a.reasoning === b.reasoning // String comparison for reasoning content
    );
}

/**
 * Check if message display state has changed.
 */
export function messageStateEqual(a: Message, b: Message): boolean {
    return a.status === b.status && a.placeholder === b.placeholder;
}

/**
 * Check if message attachments have changed.
 */
export function messageAttachmentsEqual(a: Message, b: Message): boolean {
    return a.attachments === b.attachments; // Reference equality
}

/**
 * Specialized equality check for message rendering.
 * Checks only fields that affect display, uses cheap comparisons.
 * Use this for component memoization.
 */
export function messagesEqualForRendering(a: Message, b: Message): boolean {
    return a.id === b.id && messageContentEqual(a, b) && messageStateEqual(a, b) && messageAttachmentsEqual(a, b);
}

/**
 * Strict equality check for messages.
 * Checks all fields including metadata.
 * Use for tests or when complete equality verification is needed.
 */
export function messagesDeepEqual(a: Message, b: Message): boolean {
    return (
        a.id === b.id &&
        a.createdAt === b.createdAt &&
        a.role === b.role &&
        a.parentId === b.parentId &&
        a.conversationId === b.conversationId &&
        messageStateEqual(a, b) &&
        messageContentEqual(a, b) &&
        a.context === b.context &&
        messageAttachmentsEqual(a, b) &&
        deepEqualArray(a.contextFiles, b.contextFiles)
    );
}

/**
 * Helper for array reference equality comparison.
 */
function deepEqualArray<T>(a: T[] | undefined, b: T[] | undefined): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    return a.every((item, i) => item === b[i]);
}
