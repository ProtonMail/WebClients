import { type CSSProperties, memo, useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { deriveCompactionAudit } from '../../../../../llm/compaction/audit';
import { formatTokenCount } from '../../../../../llm/utils';
import { useLumoSelector } from '../../../../../redux/hooks';
import { selectAttachments, selectMessages } from '../../../../../redux/selectors';
import type { CompactionAudit, CompactionStrategyName, Message } from '../../../../../types';
import { LumoIcon } from '../../../../LumoIcon/LumoIcon';
import { LazyProgressiveMarkdownRenderer } from '../../../../LumoMarkdown/LazyMarkdownComponents';

import './CompactionMarker.scss';

const SUMMARY_MAX_HEIGHT = '22rem';

function strategyLabel(strategy: CompactionStrategyName): string {
    switch (strategy) {
        case 'clear_tool_results':
            return c('collider_2025: Compaction').t`trimmed old tool output`;
        case 'drop_tool_pairs':
            return c('collider_2025: Compaction').t`trimmed old tool calls`;
        case 'strip_context':
            return c('collider_2025: Compaction').t`trimmed file context`;
        case 'drop_old_rounds':
            return c('collider_2025: Compaction').t`summarized older messages`;
        case 'llm_summary':
            return c('collider_2025: Compaction').t`wrote a conversation summary`;
        default:
            return strategy;
    }
}

type SummarySection = { title: string; body: string };

function parseSummarySections(summary: string): SummarySection[] {
    const sections: SummarySection[] = [];
    let current: SummarySection | null = null;
    const startRe = /^\s*\d+\.\s+(.*)$/;

    for (const line of summary.split(/\r?\n/)) {
        const start = line.match(startRe);
        if (start) {
            if (current) sections.push(current);
            const rest = start[1];
            const titleMatch = rest.match(/^(.+?)\s*[—–]\s*([\s\S]*)$/);
            current = titleMatch
                ? { title: titleMatch[1].trim(), body: titleMatch[2].trim() }
                : { title: rest.trim(), body: '' };
        } else if (current) {
            const trimmed = line.trim();
            current.body = trimmed ? (current.body ? `${current.body}\n${trimmed}` : trimmed) : `${current.body}\n`;
        }
    }
    if (current) sections.push(current);

    return sections;
}

function sectionToMarkdown(section: SummarySection): string {
    const title = section.title.trim();
    const body = section.body.trim();
    return body ? `${title}\n\n${body}` : title;
}

type CompactionSummaryMarkdownProps = {
    content: string;
    message: Message;
};

const CompactionSummaryMarkdown = memo(({ content, message }: CompactionSummaryMarkdownProps) => (
    <div className="compaction-marker-markdown lumo-color-glyph-mid">
        <LazyProgressiveMarkdownRenderer content={content} isStreaming={false} message={message} />
    </div>
));
CompactionSummaryMarkdown.displayName = 'CompactionSummaryMarkdown';

type CompactionAuditDetailsProps = {
    audit: CompactionAudit;
};

const CompactionAuditDetails = memo(({ audit }: CompactionAuditDetailsProps) => {
    const hasFiles = audit.removedFiles.length > 0;
    const hasClearedTools = audit.clearedTools.length > 0;
    const hasDroppedTools = audit.droppedTools.length > 0;

    if (!hasFiles && !hasClearedTools && !hasDroppedTools) {
        return null;
    }

    const filesLabel = c('collider_2025: Compaction').t`Files not included in new replies`;
    const clearedToolsLabel = c('collider_2025: Compaction').t`Tool output trimmed`;
    const droppedToolsLabel = c('collider_2025: Compaction').t`Tool calls trimmed`;
    const auditHeading = c('collider_2025: Compaction').t`Excluded from new replies only`;

    return (
        <div className="compaction-marker-audit px-3 py-2 border-bottom lumo-border lumo-bg-panel">
            <p className="compaction-marker-audit-heading m-0 lumo-label-small lumo-color-glyph">{auditHeading}</p>
            <ul className="compaction-marker-audit-list unstyled flex flex-column gap-1 m-0 mt-2 lumo-body-small lumo-color-glyph-mid">
                {hasFiles && (
                    <li>
                        <span className="lumo-label-large lumo-color-glyph">{filesLabel}: </span>
                        {audit.removedFiles.join(', ')}
                    </li>
                )}
                {hasClearedTools && (
                    <li>
                        <span className="lumo-label-large lumo-color-glyph">{clearedToolsLabel}: </span>
                        {audit.clearedTools.join(', ')}
                    </li>
                )}
                {hasDroppedTools && (
                    <li>
                        <span className="lumo-label-large lumo-color-glyph">{droppedToolsLabel}: </span>
                        {audit.droppedTools.join(', ')}
                    </li>
                )}
            </ul>
        </div>
    );
});
CompactionAuditDetails.displayName = 'CompactionAuditDetails';

type CompactionMarkerProps = {
    message: Message;
};

const CompactionMarkerComponent = ({ message }: CompactionMarkerProps) => {
    const [expanded, setExpanded] = useState(false);
    const messagesById = useLumoSelector(selectMessages);
    const attachmentsById = useLumoSelector(selectAttachments);
    const compaction = message.compaction;

    const audit = useMemo(() => {
        if (!compaction) {
            return undefined;
        }
        if (compaction.stats.audit) {
            return compaction.stats.audit;
        }
        return deriveCompactionAudit(compaction.summarizedMessageIds, messagesById, Object.values(attachmentsById));
    }, [attachmentsById, compaction, messagesById]);

    if (!compaction) {
        return null;
    }

    const scrollStyle = { '--max-h-custom': SUMMARY_MAX_HEIGHT } as CSSProperties;

    if (compaction.status === 'compacting') {
        return (
            <div
                className="compaction-marker flex-1 w-full min-w-0 my-4"
                data-testid="compaction-marker"
                data-compaction-status="compacting"
            >
                <div className="compaction-marker-card overflow-hidden border radius-8 lumo-bg-panel">
                    <div className="compaction-marker-bar flex flex-column gap-1 w-full px-3 py-2 lumo-body-small lumo-color-glyph lumo-bg-control-fill">
                        <span className="flex flex-nowrap items-center gap-2 lumo-label-large">
                            <CircleLoader size="small" className="shrink-0" />
                            {c('collider_2025: Compaction')
                                .t`Making room to keep going — summarizing earlier messages for the next reply…`}
                        </span>
                        <span className="lumo-body-small lumo-color-glyph-mid">
                            {c('collider_2025: Compaction')
                                .t`Nothing is removed from your chat. Scroll up anytime to read the full history.`}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    const { stats, summary } = compaction;
    const removed = formatTokenCount(stats.tokensRemoved);
    const sections = parseSummarySections(summary);
    const strategySummary = stats.appliedStrategies.map(strategyLabel).join(' · ');

    const headline = c('collider_2025: Compaction').t`Earlier messages summarized to make room`;
    const reclaimed = c('collider_2025: Compaction').t`${removed} freed`;
    const condensed = c('collider_2025: Compaction').ngettext(
        msgid`${stats.summarizedMessageCount} earlier message summarized for new replies`,
        `${stats.summarizedMessageCount} earlier messages summarized for new replies`,
        stats.summarizedMessageCount
    );
    const reassurance = c('collider_2025: Compaction')
        .t`Your chat history above is unchanged. ${LUMO_SHORT_APP_NAME} uses the summary below when replying — scroll up anytime to read the original messages.`;
    const summaryHeading = c('collider_2025: Compaction').t`Summary ${LUMO_SHORT_APP_NAME} uses for new replies`;

    return (
        <div className="compaction-marker flex-1 w-full min-w-0 my-4" data-testid="compaction-marker">
            <div
                className="compaction-marker-card overflow-hidden border radius-8 lumo-body-small lumo-bg-panel"
                data-expanded={expanded ? 'true' : 'false'}
            >
                <button
                    type="button"
                    className="compaction-marker-bar flex flex-nowrap items-center gap-2 w-full px-3 py-2 text-left lumo-color-glyph lumo-bg-control-fill"
                    onClick={() => setExpanded((v) => !v)}
                    aria-expanded={expanded}
                >
                    <LumoIcon name="Shrink" className="shrink-0 lumo-color-glyph-mid" />
                    <span className="flex-1 lumo-label-large">{headline}</span>
                    <span className="compaction-marker-badge px-1 py-0.5 radius-4 lumo-body-small text-nowrap lumo-color-glyph-mid lumo-bg-control-fill-mid">
                        {reclaimed}
                    </span>
                    {expanded ? (
                        <LumoIcon name="ChevronUp" className="shrink-0 lumo-color-glyph-mid" />
                    ) : (
                        <LumoIcon name="ChevronDown" className="shrink-0 lumo-color-glyph-mid" />
                    )}
                </button>

                <p className="compaction-marker-reassurance m-0 px-3 py-2 border-top lumo-border lumo-body-small lumo-color-glyph-mid">
                    {reassurance}
                </p>

                {expanded && (
                    <div className="compaction-marker-details border-top lumo-border">
                        <p className="compaction-marker-meta m-0 px-3 py-2 border-bottom lumo-border lumo-body-small lumo-color-glyph-mid">
                            {condensed}
                            {strategySummary && (
                                <>
                                    <span aria-hidden="true"> · </span>
                                    {strategySummary}
                                </>
                            )}
                        </p>

                        {audit && <CompactionAuditDetails audit={audit} />}

                        <div
                            className="compaction-marker-scroll overflow-y-auto max-h-custom px-3 py-3"
                            style={scrollStyle}
                        >
                            <p className="compaction-marker-summary-label m-0 pb-2 lumo-label-small lumo-color-glyph">
                                {summaryHeading}
                            </p>

                            {sections.length > 0 ? (
                                <ol className="compaction-marker-sections unstyled m-0 flex flex-column gap-2">
                                    {sections.map((section, index) => (
                                        <li
                                            key={index}
                                            className="compaction-marker-section p-3 radius-8 lumo-bg-control-fill"
                                        >
                                            <CompactionSummaryMarkdown
                                                content={sectionToMarkdown(section)}
                                                message={message}
                                            />
                                        </li>
                                    ))}
                                </ol>
                            ) : (
                                <div className="compaction-marker-fallback p-3 radius-8 lumo-bg-control-fill">
                                    <CompactionSummaryMarkdown content={summary} message={message} />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export const CompactionMarker = memo(CompactionMarkerComponent);
