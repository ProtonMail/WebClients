import type { Api } from '@proton/shared/lib/interfaces';

import { getMessageBlocks } from '../../messageHelpers';
import type { Attachment, CompactionStats, CompactionStrategyName, Message, MessageId } from '../../types';
import {
    CLEARED_TOOL_RESULT_PLACEHOLDER,
    COMPACTION_TARGET_TOKENS,
    KEEP_RECENT_TOOL_RESULTS,
    MAX_SUMMARY_INPUT_TOKENS,
} from './constants';
import { partitionChain } from './partition';
import { clearOldToolResults, dropToolPairs, stripContext } from './strategies';
import { summarizeWithLlm } from './summarize';
import {
    type AttachmentExclusion,
    estimateChainAttachmentTokens,
    estimateChainContentTokens,
    estimateChainTokens,
    estimateTextTokens,
} from './tokens';
import { buildTranscript } from './transcript';
import {
    buildCompactionAudit,
    collectClearedToolNames,
    collectDroppedToolNames,
} from './audit';

export type Summarizer = (transcript: string) => Promise<string>;

export type CompactionEngineOptions = {
    targetTokens?: number;
    keepRecentTokenBudget?: number;
    keepMinRecentMessages?: number;
    customInstructions?: string;
    signal?: AbortSignal;
    /**
     * Override the LLM summarization step (used by tests). When neither this nor
     * `api` is provided, the final LLM step is skipped and the best-effort
     * condensed transcript is returned instead.
     */
    summarize?: Summarizer;
    /**
     * Full conversation attachments, used to account for the real token cost of
     * the summarized region. Without these the reported stats only reflect
     * message text and diverge from the conversation context indicator.
     */
    attachments?: Attachment[];
    /** Per-message attachment exclusions, so excluded files are not counted as reclaimed. */
    contextFilters?: AttachmentExclusion[];
};

export type CompactionResult = {
    summary: string;
    summarizedMessageIds: MessageId[];
    keptMessageIds: MessageId[];
    stats: CompactionStats;
};

function countToolResults(messages: Message[]): number {
    let count = 0;
    for (const message of messages) {
        for (const block of getMessageBlocks(message)) {
            if (block.type === 'tool_result') {
                count += 1;
            }
        }
    }
    return count;
}

/** Tool results still carrying their original content (not cleared, not dropped). */
function countIntactToolResults(messages: Message[]): number {
    let count = 0;
    for (const message of messages) {
        for (const block of getMessageBlocks(message)) {
            if (block.type === 'tool_result' && block.content !== CLEARED_TOOL_RESULT_PLACEHOLDER) {
                count += 1;
            }
        }
    }
    return count;
}

function truncateTranscriptForSummary(transcript: string): string {
    if (estimateTextTokens(transcript) <= MAX_SUMMARY_INPUT_TOKENS) {
        return transcript;
    }
    // Keep the oldest and newest portions, drop the middle (where redundancy concentrates).
    const maxChars = MAX_SUMMARY_INPUT_TOKENS * 4;
    const headChars = Math.floor(maxChars * 0.6);
    const tailChars = maxChars - headChars;
    return (
        transcript.slice(0, headChars) +
        '\n\n[... middle of conversation omitted for length ...]\n\n' +
        transcript.slice(transcript.length - tailChars)
    );
}

/**
 * Progressive context-reduction engine.
 *
 * Splits the chain into an older `head` (summarized) and a recent `tail` (kept
 * verbatim), then shrinks the head through increasingly aggressive strategies:
 *
 *   1. clear old tool results
 *   2. drop tool call/result pairs
 *   3. strip attachment/file context
 *   4. (last resort) ask the LLM to summarize the reduced transcript
 *
 * It stops as soon as the head fits the per-head token budget; the LLM step only
 * runs if the cheaper strategies were insufficient. The produced `summary`
 * replaces every message in `summarizedMessageIds` for subsequent requests.
 */
export async function compactConversation(
    chain: Message[],
    api?: Api,
    options: CompactionEngineOptions = {}
): Promise<CompactionResult> {
    const { head, tail } = partitionChain(chain, {
        keepRecentTokenBudget: options.keepRecentTokenBudget,
        keepMinRecentMessages: options.keepMinRecentMessages,
    });

    const target = options.targetTokens ?? COMPACTION_TARGET_TOKENS;
    const tailTokens = estimateChainTokens(tail);
    const headBudget = Math.max(0, target - tailTokens);

    // Real token footprint of the region being collapsed, on the same basis as the
    // conversation context indicator: visible content + active (non-excluded)
    // attachments. Dropping these head messages removes their attachments from
    // every subsequent request, which is the dominant saving in file-heavy chats.
    const allAttachments = options.attachments ?? [];
    const exclusions = options.contextFilters ?? [];
    const tokensBefore =
        estimateChainContentTokens(head) + estimateChainAttachmentTokens(head, allAttachments, exclusions);

    const initialToolResults = countToolResults(head);
    const appliedStrategies: CompactionStrategyName[] = [];
    let working = head;
    let transcript = buildTranscript(working);
    const clearedTools: string[] = [];
    const droppedTools: string[] = [];

    const withinBudget = () => estimateTextTokens(transcript) <= headBudget;

    if (!withinBudget()) {
        const before = working;
        const res = clearOldToolResults(working, KEEP_RECENT_TOOL_RESULTS);
        if (res.affected > 0) {
            working = res.messages;
            transcript = buildTranscript(working);
            appliedStrategies.push('clear_tool_results');
            clearedTools.push(...collectClearedToolNames(before, working));
        }
    }

    if (!withinBudget()) {
        const before = working;
        const res = dropToolPairs(working);
        if (res.affected > 0) {
            working = res.messages;
            transcript = buildTranscript(working);
            appliedStrategies.push('drop_tool_pairs');
            droppedTools.push(...collectDroppedToolNames(before, working));
        }
    }

    if (!withinBudget()) {
        const res = stripContext(working);
        if (res.affected > 0) {
            working = res.messages;
            transcript = buildTranscript(working);
            appliedStrategies.push('strip_context');
        }
    }

    const summarizer: Summarizer | undefined =
        options.summarize ??
        (api
            ? (t: string) =>
                  summarizeWithLlm(api, t, {
                      signal: options.signal,
                      customInstructions: options.customInstructions,
                  })
            : undefined);

    let summary: string;
    let usedLlmSummary = false;

    if (!withinBudget() && summarizer) {
        summary = await summarizer(truncateTranscriptForSummary(transcript));
        usedLlmSummary = true;
        appliedStrategies.push('llm_summary');
    } else {
        // Cheaper strategies sufficed (or no summarizer available): the reduced
        // transcript becomes the compacted replacement as-is.
        summary = transcript;
    }

    const clearedToolResultCount = Math.max(0, initialToolResults - countIntactToolResults(working));
    const tokensAfter = estimateTextTokens(summary);

    const stats: CompactionStats = {
        tokensBefore,
        tokensAfter,
        tokensRemoved: Math.max(0, tokensBefore - tokensAfter),
        summarizedMessageCount: head.length,
        keptMessageCount: tail.length,
        clearedToolResultCount,
        appliedStrategies,
        usedLlmSummary,
        audit: buildCompactionAudit(head, allAttachments, [...new Set(clearedTools)], [...new Set(droppedTools)]),
    };

    return {
        summary,
        summarizedMessageIds: head.map((m) => m.id),
        keptMessageIds: tail.map((m) => m.id),
        stats,
    };
}
