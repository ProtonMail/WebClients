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
 * This omits the tool calls, though, so use only if you need flat text in a "lossy" way i.e., without the tool calls
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
 * Get all tool call blocks from a message.
 */
export function getMessageToolCalls(message: Message): ToolCallBlock[] {
    return getMessageBlocks(message).filter(isToolCallBlock);
}

/**
 * Get all tool result blocks from a message.
 */
export function getMessageToolResults(message: Message): ToolResultBlock[] {
    return getMessageBlocks(message).filter(isToolResultBlock);
}

/**
 * Check if a message has any text content.
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

function readStringField(parsed: unknown, field: string): string | undefined {
    if (typeof parsed !== 'object' || parsed === null) {
        return undefined;
    }
    const value = (parsed as Record<string, unknown>)[field];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/** OpenAI tool-call id from parsed tool-call JSON (`id` or legacy `call_id`). */
function getToolCallId(parsed: unknown): string | undefined {
    return readStringField(parsed, 'id') ?? readStringField(parsed, 'call_id');
}

function replaceAt(blocks: ContentBlock[], index: number, block: ContentBlock): ContentBlock[] {
    return [...blocks.slice(0, index), block, ...blocks.slice(index + 1)];
}

function findToolResult(
    blocks: ContentBlock[],
    predicate: (block: ToolResultBlock, index: number) => boolean
): ToolResultBlock | undefined {
    for (let index = 0; index < blocks.length; index++) {
        const block = blocks[index];
        if (isToolResultBlock(block) && predicate(block, index)) {
            return block;
        }
    }
    return undefined;
}

/** Tool call id of a tool_call block, when the stream provided one. */
export function getToolCallBlockId(block: ToolCallBlock): string | undefined {
    return getToolCallId(block.toolCall) ?? getToolCallId(tryParseJSON(block.content));
}

/**
 * Find the tool_result block produced by a given tool_call block.
 *
 * An exact `tool_call_id` match wins, so parallel calls to the same tool (weather for London
 * and for Paris) each resolve to their own result no matter what order the backend streamed them
 * in. Otherwise we take the first *untagged* result after the call — that covers client tools,
 * which tag the call but not the result, without ever stealing a result that demonstrably belongs
 * to a different call.
 */
export function findToolResultForCall(blocks: ContentBlock[], call: ToolCallBlock): ToolResultBlock | undefined {
    const callName = readStringField(tryParseJSON(call.content), 'name');
    if (callName === 'stock' || callName === 'cryptocurrency') {
        const financeCalls = getFinanceToolCalls(blocks);
        const financeResults = getFinanceToolResults(blocks);
        const claimed = new Set<ToolResultBlock>();

        for (const candidateCall of financeCalls) {
            const callId = getToolCallBlockId(candidateCall);
            const result =
                (callId && financeResults.find((block) => block.tool_call_id === callId && !claimed.has(block))) ||
                financeResults.find((block) => !claimed.has(block));

            if (candidateCall === call) {
                return result;
            }

            if (result) {
                claimed.add(result);
            }
        }

        return undefined;
    }

    const callId = getToolCallBlockId(call);
    if (callId) {
        const tagged = findToolResult(blocks, (block) => block.tool_call_id === callId);
        if (tagged) {
            return tagged;
        }
    }

    const callIndex = blocks.indexOf(call);
    if (callIndex === -1) {
        return undefined;
    }

    return findToolResult(blocks, (block, index) => index > callIndex && block.tool_call_id === undefined);
}

/**
 * Index of the tool_call block that an incoming chunk updates, or -1 when it starts a new call.
 *
 * Chunks carrying a call id only ever match that same id, so sibling calls to the same tool
 * (e.g. weather for London and for Paris) stay separate. Legacy id-less streams fall back to
 * matching a trailing same-name call, which is how announce → dispatch used to be merged.
 */
function findToolCallBlockIndex(blocks: ContentBlock[], parsed: unknown): number {
    const id = getToolCallId(parsed);
    if (id) {
        return blocks.findLastIndex((block) => isToolCallBlock(block) && getToolCallBlockId(block) === id);
    }

    const name = readStringField(parsed, 'name');
    const lastIndex = blocks.length - 1;
    const lastBlock = blocks[lastIndex];
    const matchesTrailingCall =
        name !== undefined &&
        isToolCallBlock(lastBlock) &&
        readStringField(lastBlock.toolCall, 'name') === name &&
        getToolCallBlockId(lastBlock) === undefined;

    return matchesTrailingCall ? lastIndex : -1;
}

/**
 * Id of the earliest tool_call block that does not yet have a tagged tool_result.
 * Used when a result chunk arrives without a call id but sibling calls were tagged
 * (e.g. parallel stock lookups via server_tool_call + legacy tool_result stream).
 */
function findUnpairedToolCallId(blocks: ContentBlock[]): string | undefined {
    for (const block of blocks) {
        if (!isToolCallBlock(block)) {
            continue;
        }

        const callId = getToolCallBlockId(block);
        if (!callId) {
            continue;
        }

        const hasResult = blocks.some(
            (candidate) => isToolResultBlock(candidate) && candidate.tool_call_id === callId
        );
        if (!hasResult) {
            return callId;
        }
    }

    return undefined;
}

function countUnpairedIdLessToolCalls(blocks: ContentBlock[]): number {
    const idLessCalls = blocks
        .filter(isToolCallBlock)
        .filter((block) => getToolCallBlockId(block) === undefined).length;
    const untaggedResults = blocks.filter(
        (block) => isToolResultBlock(block) && block.tool_call_id === undefined
    ).length;

    return Math.max(0, idLessCalls - untaggedResults);
}

function getFinanceResultIdentity(content: string): string | undefined {
    try {
        const parsed = JSON.parse(content) as { current_price?: unknown; company_info?: { name?: unknown } };
        if (typeof parsed.current_price !== 'number') {
            return undefined;
        }
        if (typeof parsed.company_info?.name === 'string' && parsed.company_info.name.length > 0) {
            return parsed.company_info.name;
        }
        return String(parsed.current_price);
    } catch {
        return undefined;
    }
}

function getFinanceSymbolFromCallContent(content: string): string | undefined {
    const parsed = tryParseJSON(content) as { name?: unknown; arguments?: { symbol?: unknown } } | undefined;
    if (parsed?.name !== 'stock' && parsed?.name !== 'cryptocurrency') {
        return undefined;
    }
    const symbol = parsed.arguments?.symbol;
    return typeof symbol === 'string' && symbol.trim().length > 0 ? symbol.trim() : undefined;
}

function getFinanceToolCalls(blocks: ContentBlock[]): ToolCallBlock[] {
    return blocks.filter(
        (block): block is ToolCallBlock => isToolCallBlock(block) && getFinanceSymbolFromCallContent(block.content) !== undefined
    );
}

function getFinanceToolResults(blocks: ContentBlock[]): ToolResultBlock[] {
    return blocks.filter(
        (block): block is ToolResultBlock =>
            isToolResultBlock(block) && getFinanceResultIdentity(block.content) !== undefined
    );
}

function isDistinctFinanceUpdate(previous: string, next: string): boolean {
    const prevIdentity = getFinanceResultIdentity(previous);
    const nextIdentity = getFinanceResultIdentity(next);
    return prevIdentity !== undefined && nextIdentity !== undefined && prevIdentity !== nextIdentity;
}

/** Index of the tool_result block an incoming chunk updates, or -1 when it starts a new result. */
function findToolResultBlockIndex(blocks: ContentBlock[], toolCallId?: string): number {
    if (toolCallId) {
        return blocks.findLastIndex((block) => isToolResultBlock(block) && block.tool_call_id === toolCallId);
    }

    const lastIndex = blocks.length - 1;
    return isToolResultBlock(blocks[lastIndex]) ? lastIndex : -1;
}

/**
 * Whether an incoming tool-call chunk updates an existing block (streaming announce → dispatch)
 * rather than starting a new tool call.
 */
export function isToolCallStreamingUpdate(blocks: ContentBlock[], toolCall: string): boolean {
    return findToolCallBlockIndex(blocks, tryParseJSON(toolCall)) !== -1;
}

/**
 * Set tool call in blocks array.
 * Updates the matching tool_call block in place, otherwise appends a new one.
 */
export function setToolCallInBlocks(blocks: ContentBlock[], toolCall: string): ContentBlock[] {
    const parsed = tryParseJSON(toolCall);
    const index = findToolCallBlockIndex(blocks, parsed);
    const block: ToolCallBlock = { type: 'tool_call', content: toolCall, toolCall: parsed };

    return index === -1 ? [...blocks, block] : replaceAt(blocks, index, block);
}

/**
 * Set tool result in blocks array.
 * Updates the result of the matching `tool_call_id` when one is given; without an id it falls
 * back to updating a trailing tool_result. Otherwise appends a new one.
 */
export function setToolResultInBlocks(
    blocks: ContentBlock[],
    toolResult: string,
    meta?: ToolResultBlock['meta'],
    toolCallId?: string
): ContentBlock[] {
    const resolvedToolCallId = toolCallId ?? findUnpairedToolCallId(blocks);

    if (resolvedToolCallId !== undefined) {
        const index = findToolResultBlockIndex(blocks, resolvedToolCallId);
        const prev = index === -1 ? undefined : (blocks[index] as ToolResultBlock);
        if (prev && isDistinctFinanceUpdate(prev.content, toolResult)) {
            const resolvedMeta = meta ?? prev.meta;
            const block: ToolResultBlock = {
                type: 'tool_result',
                content: toolResult,
                toolResult: tryParseJSON(toolResult),
                ...(resolvedMeta ? { meta: resolvedMeta } : {}),
            };

            return [...blocks, block];
        }

        const resolvedMeta = meta ?? prev?.meta;
        const block: ToolResultBlock = {
            type: 'tool_result',
            content: toolResult,
            toolResult: tryParseJSON(toolResult),
            tool_call_id: resolvedToolCallId,
            ...(resolvedMeta ? { meta: resolvedMeta } : {}),
        };

        return index === -1 ? [...blocks, block] : replaceAt(blocks, index, block);
    }

    // Legacy id-less stream: update a trailing tool_result in place, otherwise append.
    const trailingIndex = findToolResultBlockIndex(blocks, undefined);
    const index = trailingIndex !== -1 && countUnpairedIdLessToolCalls(blocks) > 0 ? -1 : trailingIndex;
    const prev = index === -1 ? undefined : (blocks[index] as ToolResultBlock);
    const resolvedMeta = meta ?? prev?.meta;
    const block: ToolResultBlock = {
        type: 'tool_result',
        content: toolResult,
        toolResult: tryParseJSON(toolResult),
        ...(prev?.tool_call_id ? { tool_call_id: prev.tool_call_id } : {}),
        ...(resolvedMeta ? { meta: resolvedMeta } : {}),
    };

    return index === -1 ? [...blocks, block] : replaceAt(blocks, index, block);
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
