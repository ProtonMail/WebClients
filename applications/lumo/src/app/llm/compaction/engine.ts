import type { Api } from '@proton/shared/lib/interfaces';

import { getMessageBlocks } from '../../messageHelpers';
import type { Attachment, CompactionStats, CompactionStrategyName, Message, MessageId } from '../../types';
import { buildCompactionAudit, collectClearedToolNames, collectDroppedToolNames } from './audit';
import { SUMMARY_TURN_PREFIX, collapseCompactedChain } from './collapse';
import {
    CLEARED_TOOL_RESULT_PLACEHOLDER,
    COMPACTION_TARGET_TOKENS,
    KEEP_RECENT_TOOL_RESULTS,
    MAX_SUMMARY_INPUT_TOKENS,
    MIN_COMPACTION_TOKENS_RECLAIMED,
} from './constants';
import { NotEnoughToCompactError, partitionChain } from './partition';
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
     * Force the LLM summarization step to run even when the cheaper strategies
     * (or the existing size) already bring the head within budget. Used by the
     * debug console to exercise the full summarization path on demand; a
     * summarizer (or `api`) must be available for this to have any effect.
     */
    forceLlmSummary?: boolean;
    /**
     * Full conversation attachments, used to account for the real token cost of
     * the summarized region. Without these the reported stats only reflect
     * message text and diverge from the conversation context indicator.
     */
    attachments?: Attachment[];
    /** Per-message attachment exclusions, so excluded files are not counted as reclaimed. */
    contextFilters?: AttachmentExclusion[];
    /**
     * Messages of the whole conversation. Lets an edited fork see the boundary that
     * summarized the shared history before the edit, so it condenses only what is left
     * instead of re-summarizing history the sibling already folded away.
     */
    messageMap?: Record<MessageId, Message>;
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

/** Introduces a carried-forward summary, both to the summarizer and in the stored text. */
const PRIOR_SUMMARY_HEADING = 'Summary of earlier conversation:';

/**
 * Drops the display preamble a collapsed summary carries, so re-summarizing does not
 * nest one preamble inside the next on every subsequent pass.
 */
function stripSummaryTurnPrefix(content: string | undefined): string {
    if (!content) {
        return '';
    }
    return content.startsWith(SUMMARY_TURN_PREFIX) ? content.slice(SUMMARY_TURN_PREFIX.length).trim() : content;
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
    // Only partition the post-compaction view. The display chain still contains
    // messages already summarized by earlier boundaries; re-processing them would
    // inflate the next summary and undo the space reclaimed.
    const { summaryTurn: priorSummaryTurn, chain: chainToCompact } = collapseCompactedChain(chain, options.messageMap);

    const { head, tail } = partitionChain(chainToCompact, {
        keepRecentTokenBudget: options.keepRecentTokenBudget,
        keepMinRecentMessages: options.keepMinRecentMessages,
        attachments: options.attachments,
        contextFilters: options.contextFilters,
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

    // An earlier boundary's summary is the only surviving record of the history it
    // replaced, and only the newest boundary's summary is ever sent to the model. So a
    // repeat compaction must fold the prior summary into the new one, or that history
    // vanishes from the model's view rather than being carried forward. It counts on
    // both sides of the ledger below: it is part of what this pass consumes, and part
    // of what it produces.
    const priorSummary = stripSummaryTurnPrefix(priorSummaryTurn?.content);
    const composeTranscript = (messages: Message[]): string => {
        const body = buildTranscript(messages);
        if (!priorSummary) {
            return body;
        }
        const seeded = `${PRIOR_SUMMARY_HEADING}\n${priorSummary}`;
        return body ? `${seeded}\n\n${body}` : seeded;
    };

    const tokensBefore =
        estimateTextTokens(priorSummary) +
        estimateChainContentTokens(head) +
        estimateChainAttachmentTokens(head, allAttachments, exclusions);

    const initialToolResults = countToolResults(head);
    const appliedStrategies: CompactionStrategyName[] = [];
    let working = head;
    let transcript = composeTranscript(working);
    const clearedTools: string[] = [];
    const droppedTools: string[] = [];

    const withinBudget = () => estimateTextTokens(transcript) <= headBudget;

    if (!withinBudget()) {
        const before = working;
        const res = clearOldToolResults(working, KEEP_RECENT_TOOL_RESULTS);
        if (res.affected > 0) {
            working = res.messages;
            transcript = composeTranscript(working);
            appliedStrategies.push('clear_tool_results');
            clearedTools.push(...collectClearedToolNames(before, working));
        }
    }

    if (!withinBudget()) {
        const before = working;
        const res = dropToolPairs(working);
        if (res.affected > 0) {
            working = res.messages;
            transcript = composeTranscript(working);
            appliedStrategies.push('drop_tool_pairs');
            droppedTools.push(...collectDroppedToolNames(before, working));
        }
    }

    if (!withinBudget()) {
        const res = stripContext(working);
        if (res.affected > 0) {
            working = res.messages;
            transcript = composeTranscript(working);
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

    if ((!withinBudget() || options.forceLlmSummary) && summarizer) {
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

    const tokensRemoved = Math.max(0, tokensBefore - tokensAfter);

    // Refuse no-op compactions: they create duplicate boundary markers without
    // freeing any context (common when a first pass already summarized the head
    // and the request is still over limit because of the preserved tail/files).
    if (tokensRemoved < MIN_COMPACTION_TOKENS_RECLAIMED && !options.forceLlmSummary) {
        throw new NotEnoughToCompactError();
    }

    const stats: CompactionStats = {
        tokensBefore,
        tokensAfter,
        tokensRemoved,
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
