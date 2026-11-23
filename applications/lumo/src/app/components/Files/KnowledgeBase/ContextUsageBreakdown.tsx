import React from 'react';

import { c, msgid } from 'ttag';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useRequestBudget } from '../../../hooks/useContextLimits';
import { useEffectiveContextUsageWithFilters } from '../../../hooks/useEffectiveContextUsage';
import type { ContextFilter } from '../../../llm';
import { type ContextSegmentId, buildContextBreakdown } from '../../../llm/contextBreakdown';
import type { Attachment, Message } from '../../../types';

import './ContextUsageBreakdown.scss';

interface ContextUsageBreakdownProps {
    messageChain: Message[];
    spaceId?: string;
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
            return c('collider_2025: Info').t`Tools`;
        case 'instructions':
            return c('collider_2025: Info').t`Instructions`;
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
    spaceId,
    contextFilters,
    currentAttachments = [],
    showDetails = false,
}) => {
    const { window: windowTokens, reservedOutput } = useRequestBudget(messageChain[0]?.conversationId);
    const {
        usedTokens: estimatedUsedTokens,
        conversationTokens,
        toolCallTokens,
        instructionTokens,
        fileTokens,
        isPending,
        isUnavailable,
        isStale,
        hasCompaction,
        droppedForBudget,
        cardedFiles,
    } = useEffectiveContextUsageWithFilters(messageChain, contextFilters, currentAttachments, spaceId);
    const onDemandCount = cardedFiles.size;

    const breakdown = React.useMemo(
        () =>
            buildContextBreakdown({
                usedTokens: estimatedUsedTokens,
                conversationTokens,
                toolCallTokens,
                instructionTokens,
                fileTokens,
                maxTokens: windowTokens,
                bufferTokens: reservedOutput,
            }),
        [
            estimatedUsedTokens,
            conversationTokens,
            toolCallTokens,
            instructionTokens,
            fileTokens,
            windowTokens,
            reservedOutput,
        ]
    );

    if (isUnavailable) {
        return (
            <p className="lumo-body-small color-weak">{c('collider_2025: Info').t`Context estimate unavailable.`}</p>
        );
    }
    if (isPending) {
        return null;
    }

    const { segments, usedTokens, maxTokens, percentageUsed, overCapacity } = breakdown;

    const used = shortTokens(usedTokens);
    const maximum = shortTokens(maxTokens);

    // translator: Technical context-usage label. ${used} is the token usage and ${maximum} is the token limit, both abbreviated counts such as 101.0K; ${percentageUsed} is the percentage of the limit used.
    const usageLabel = c('collider_2025: Info').t`${used} / ${maximum} tokens (${percentageUsed}%)`;

    return (
        <div className="context-usage w-full">
            {isStale && (
                <p className="m-0 mb-1 lumo-body-small lumo-color-glyph-mid">{c('collider_2025: Info')
                    .t`Showing the last context estimate.`}</p>
            )}
            <div className="context-usage-summary flex items-center justify-space-between gap-2 mb-1">
                <span
                    className={
                        overCapacity
                            ? 'lumo-label-medium lumo-color-signal-danger'
                            : 'lumo-body-small lumo-color-glyph-mid'
                    }
                >
                    {usageLabel}
                </span>
                {overCapacity && (
                    <span className="lumo-label-small lumo-color-signal-danger">{c('collider_2025: Info')
                        .t`Over capacity`}</span>
                )}
            </div>

            <div className="context-usage-bar w-full radius-full lumo-bg-control-fill-mid">
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
                        .filter((segment) => segment.id === 'buffer' || segment.id === 'free' || segment.tokens > 0)
                        .map((segment) => (
                            <li
                                key={segment.id}
                                className="context-usage-legend-row flex items-center gap-2 lumo-label-medium"
                            >
                                <span
                                    className={`context-usage-dot context-usage-seg--${segment.id} shrink-0${segment.id === 'free' ? ' border' : ''}`}
                                />
                                <span className="flex-1 lumo-color-glyph-mid">{segmentLabel(segment.id)}</span>
                                <span className="lumo-color-glyph-mid">{shortTokens(segment.tokens)}</span>
                            </li>
                        ))}
                </ul>
            )}

            {showDetails && hasCompaction && (
                <p className="context-usage-note m-0 mt-2 lumo-body-small lumo-color-glyph-mid">
                    {c('collider_2025: Info')
                        .t`Earlier messages were summarized to free space. They are still in your chat above — only the summary counts toward usage here.`}
                </p>
            )}

            {droppedForBudget.length > 0 && (
                <p className="context-usage-note m-0 mt-2 lumo-body-small lumo-color-glyph-mid">
                    {c('collider_2025: Info').ngettext(
                        msgid`${droppedForBudget.length} least relevant file was left out of this reply so the rest fits.`,
                        `${droppedForBudget.length} least relevant files were left out of this reply so the rest fits.`,
                        droppedForBudget.length
                    )}
                </p>
            )}

            {onDemandCount > 0 && (
                <p className="context-usage-note m-0 mt-2 lumo-body-small lumo-color-glyph-mid">
                    {/* translator: ${onDemandCount} is a number of files; ${LUMO_SHORT_APP_NAME} is the app name, "Lumo". */}
                    {c('collider_2025: Info').ngettext(
                        msgid`${onDemandCount} large file is read on demand: ${LUMO_SHORT_APP_NAME} looks up the parts it needs instead of loading it all.`,
                        `${onDemandCount} large files are read on demand: ${LUMO_SHORT_APP_NAME} looks up the parts it needs instead of loading them all.`,
                        onDemandCount
                    )}
                </p>
            )}
        </div>
    );
};
