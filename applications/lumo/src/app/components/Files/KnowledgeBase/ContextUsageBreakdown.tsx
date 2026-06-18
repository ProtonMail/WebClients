import React from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import type { ContextFilter } from '../../../llm';
import { getSummarizedMessageIds } from '../../../llm/compaction';
import { buildContextBreakdown, type ContextSegmentId } from '../../../llm/contextBreakdown';
import { countTokens } from '../../../llm/tokenizer';
import { calculateAttachmentContextSize, calculateMessageContentTokens } from '../../../llm/utils';
import { useLumoSelector } from '../../../redux/hooks';
import { selectAttachments } from '../../../redux/selectors';
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
    const allAttachments = useLumoSelector(selectAttachments);

    const { conversationTokens, fileTokens, hasCompaction } = React.useMemo(() => {
        const summarizedIds = getSummarizedMessageIds(messageChain);
        let summaryTokens = 0;
        for (const message of messageChain) {
            if (message.compaction) {
                summaryTokens += countTokens(message.compaction.summary);
            }
        }

        const effectiveMessages = messageChain.filter((m) => !summarizedIds.has(m.id));
        const conversationTokens = calculateMessageContentTokens(effectiveMessages) + summaryTokens;

        const activeFiles: Attachment[] = [];
        for (const message of messageChain) {
            if (summarizedIds.has(message.id) || !message.attachments) {
                continue;
            }
            const filter = contextFilters.find((f) => f.messageId === message.id);
            for (const shallow of message.attachments) {
                if (filter?.excludedFiles.includes(shallow.filename)) {
                    continue;
                }
                const full = allAttachments[shallow.id];
                if (full && !activeFiles.some((f) => f.id === full.id)) {
                    activeFiles.push(full);
                }
            }
        }
        for (const attachment of currentAttachments) {
            if (!activeFiles.some((f) => f.id === attachment.id)) {
                activeFiles.push(attachment);
            }
        }

        return {
            conversationTokens,
            fileTokens: calculateAttachmentContextSize(activeFiles),
            hasCompaction: summarizedIds.size > 0,
        };
    }, [messageChain, contextFilters, currentAttachments, allAttachments]);

    const breakdown = React.useMemo(
        () => buildContextBreakdown({ conversationTokens, fileTokens }),
        [conversationTokens, fileTokens]
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
                    {segments.map((segment) => (
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
                        .t`Earlier messages were summarized to make room, so they no longer take up space here.`}
                </p>
            )}
        </div>
    );
};

export default ContextUsageBreakdown;
