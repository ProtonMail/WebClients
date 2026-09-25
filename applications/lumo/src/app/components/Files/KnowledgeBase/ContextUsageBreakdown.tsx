import React from 'react';

import { clsx } from 'clsx';
import { c, msgid } from 'ttag';

import { useContextWindowConfig } from '../../../hooks/useContextLimits';
import { useEffectiveContextUsageWithFilters } from '../../../hooks/useEffectiveContextUsage';
import type { ContextFilter } from '../../../llm';
import { type ContextSegmentId, buildContextBreakdown } from '../../../llm/contextBreakdown';
import type { Attachment, Message } from '../../../types';

import './ContextUsageBreakdown.scss';

interface ContextUsageBreakdownProps {
    messageChain: Message[];
    contextFilters: ContextFilter[];
    currentAttachments?: Attachment[];
    /** Show the per-category legend in addition to the bar. */
    showDetails?: boolean;
}

/** Compact token formatter without the trailing unit (e.g. "101.0K", "850"). */
function shortTokens(tokens: number): string {
    return tokens < 1000 ? `${Math.round(tokens)}` : `${(tokens / 1000).toFixed(1)}K`;
}

function segmentLabel(id: ContextSegmentId): string {
    switch (id) {
        case 'conversation':
            return c('collider_2025: Info').t`Conversation`;
        case 'tool_calls':
            return c('collider_2025: Info').t`Tool calls`;
        case 'files':
            return c('collider_2025: Info').t`Files`;
        case 'buffer':
            return c('collider_2025: Info').t`Reserved to keep chatting`;
        case 'free':
            return c('collider_2025: Info').t`Free space`;
    }
}

/**
 * A breakdown of how the conversation's context window is being used, split into
 * conversation history, files, a reserved auto-compaction buffer, and free space.
 *
 * Token accounting mirrors what is actually sent to the model: messages that a
 * compaction boundary has summarized (and their attachments) are excluded and
 * replaced by the much smaller summary, so the bar reflects post-compaction
 * reality rather than the raw history.
 */
export const ContextUsageBreakdown: React.FC<ContextUsageBreakdownProps> = ({
    messageChain,
    contextFilters,
    currentAttachments = [],
    showDetails = false,
}) => {
    const { limits, proactiveCompactionThresholdTokens } = useContextWindowConfig();
    const { conversationTokens, toolCallTokens, fileTokens, hasCompaction, droppedForBudget } =
        useEffectiveContextUsageWithFilters(
        messageChain,
        contextFilters,
        currentAttachments
        );

    const breakdown = React.useMemo(
        () =>
            buildContextBreakdown({
                conversationTokens,
                toolCallTokens,
                fileTokens,
                maxTokens: limits.MAX_CONTEXT,
                proactiveCompactionThresholdTokens,
            }),
        [conversationTokens, toolCallTokens, fileTokens, limits.MAX_CONTEXT, proactiveCompactionThresholdTokens]
    );

    const { segments, usedTokens, maxTokens, percentageUsed, overCapacity } = breakdown;

    // translator: e.g. "101.0K / 128.0K tokens (79%)"
    const usageLabel = `${shortTokens(usedTokens)} / ${shortTokens(maxTokens)} ${c('collider_2025: Info').t`tokens`} (${percentageUsed}%)`;

    return (
        <div className="context-usage w-full">
            <div className="context-usage-summary flex items-center justify-space-between gap-2 mb-1">
                <span className={clsx('text-xs', overCapacity ? 'color-danger text-bold' : 'color-weak')}>
                    {usageLabel}
                </span>
                {overCapacity && (
                    <span className="text-xs color-danger">{c('collider_2025: Info').t`Over capacity`}</span>
                )}
            </div>

            <div className="context-usage-bar w-full rounded-full" role="presentation">
                {segments
                    .filter((segment) => segment.percentage > 0)
                    .map((segment) => (
                        <span
                            key={segment.id}
                            className={`context-usage-seg context-usage-seg--${segment.id}`}
                            style={{ width: `${segment.percentage}%` }}
                        />
                    ))}
            </div>

            {showDetails && (
                <ul className="context-usage-legend unstyled m-0 mt-2 flex flex-column gap-1">
                    {segments
                        .filter(
                            (segment) =>
                                segment.id === 'buffer' ||
                                segment.id === 'free' ||
                                segment.tokens > 0
                        )
                        .map((segment) => (
                        <li key={segment.id} className="context-usage-legend-row flex items-center gap-2 text-xs">
                            <span className={`context-usage-dot context-usage-seg--${segment.id} shrink-0`} />
                            <span className="flex-1 color-weak">{segmentLabel(segment.id)}</span>
                            <span className="color-weak">{shortTokens(segment.tokens)}</span>
                        </li>
                    ))}
                </ul>
            )}

            {showDetails && hasCompaction && (
                <p className="context-usage-note m-0 mt-2 text-xs color-weak">
                    {c('collider_2025: Info')
                        .t`Earlier messages were summarized to free space. They are still in your chat above — only the summary counts toward usage here.`}
                </p>
            )}

            {droppedForBudget.length > 0 && (
                <p className="context-usage-note m-0 mt-2 text-xs color-weak">
                    {c('collider_2025: Info').ngettext(
                        msgid`${droppedForBudget.length} least relevant file was left out of this reply so the rest fits.`,
                        `${droppedForBudget.length} least relevant files were left out of this reply so the rest fits.`,
                        droppedForBudget.length
                    )}
                </p>
            )}
        </div>
    );
};

export default ContextUsageBreakdown;
