import { getMessageBlocks } from '../../messageHelpers';
import type { ContentBlock, Message } from '../../types';
import { CLEARED_TOOL_RESULT_PLACEHOLDER } from './constants';

export type StrategyResult = {
    messages: Message[];
    /** Number of items affected (tool results cleared, blocks dropped, contexts stripped). */
    affected: number;
};

function withBlocks(message: Message, blocks: ContentBlock[]): Message {
    return { ...message, blocks };
}

/**
 * Strategy 1 — clear old tool results.
 *
 * Replaces the content of older `tool_result` blocks with a short placeholder,
 * keeping the most recent `keepRecent` results intact. This is the cheapest
 * reduction: tool output (file reads, search results, web fetches) is typically
 * the bulk of a long context and is rarely needed verbatim once acted upon.
 */
export function clearOldToolResults(messages: Message[], keepRecent: number): StrategyResult {
    // Count total tool results so we know which ones fall outside the keep window.
    let totalToolResults = 0;
    for (const message of messages) {
        for (const block of getMessageBlocks(message)) {
            if (block.type === 'tool_result') {
                totalToolResults += 1;
            }
        }
    }

    const clearThreshold = Math.max(0, totalToolResults - keepRecent);
    let seen = 0;
    let affected = 0;

    const nextMessages = messages.map((message) => {
        const blocks = getMessageBlocks(message);
        let mutated = false;
        const nextBlocks = blocks.map((block): ContentBlock => {
            if (block.type !== 'tool_result') {
                return block;
            }
            const index = seen;
            seen += 1;
            if (index < clearThreshold && block.content !== CLEARED_TOOL_RESULT_PLACEHOLDER) {
                mutated = true;
                affected += 1;
                return { ...block, content: CLEARED_TOOL_RESULT_PLACEHOLDER, toolResult: undefined };
            }
            return block;
        });
        return mutated ? withBlocks(message, nextBlocks) : message;
    });

    return { messages: nextMessages, affected };
}

/**
 * Strategy 2 — drop tool call/result pairs entirely.
 *
 * Removes every `tool_call` and `tool_result` block, leaving only assistant/user
 * prose. The model's textual reasoning around the tools is preserved, which is
 * usually enough to reconstruct intent.
 */
export function dropToolPairs(messages: Message[]): StrategyResult {
    let affected = 0;
    const nextMessages = messages.map((message) => {
        const blocks = getMessageBlocks(message);
        const nextBlocks = blocks.filter((block) => {
            const isTool = block.type === 'tool_call' || block.type === 'tool_result';
            if (isTool) {
                affected += 1;
            }
            return !isTool;
        });
        return nextBlocks.length === blocks.length ? message : withBlocks(message, nextBlocks);
    });
    return { messages: nextMessages, affected };
}

/**
 * Strategy 3 — strip pre-flattened attachment/file context.
 *
 * Drops the `context` field (RAG/file content baked into a message). The summary
 * captures any conclusions drawn from those files; the raw content is the
 * single largest token sink after tool output.
 */
export function stripContext(messages: Message[]): StrategyResult {
    let affected = 0;
    const nextMessages = messages.map((message) => {
        if (message.context === undefined) {
            return message;
        }
        affected += 1;
        const { context, ...rest } = message;
        return rest as Message;
    });
    return { messages: nextMessages, affected };
}
