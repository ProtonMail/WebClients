import { memo, useMemo, useState, type CSSProperties } from 'react';

import { c, msgid } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';
import { IcChevronUp } from '@proton/icons/icons/IcChevronUp';
import { IcArrowsToCenter } from '@proton/icons/icons/IcArrowsToCenter';

import { deriveCompactionAudit } from '../../../../../llm/compaction/audit';
import { formatTokenCount } from '../../../../../llm/utils';
import { useLumoSelector } from '../../../../../redux/hooks';
import { selectAttachments, selectMessages } from '../../../../../redux/selectors';
import type { CompactionAudit, CompactionStrategyName, Message } from '../../../../../types';
import { LazyProgressiveMarkdownRenderer } from '../../../../LumoMarkdown/LazyMarkdownComponents';

import './CompactionMarker.scss';
import {LUMO_SHORT_APP_NAME} from "@proton/shared/lib/constants.ts";

const SUMMARY_MAX_HEIGHT = '22rem';

function strategyLabel(strategy: CompactionStrategyName): string {
    switch (strategy) {
        case 'clear_tool_results':
            return c('collider_2025: Compaction').t`cleared old tool results`;
        case 'drop_tool_pairs':
            return c('collider_2025: Compaction').t`removed tool calls`;
        case 'strip_context':
            return c('collider_2025: Compaction').t`removed file context`;
        case 'drop_old_rounds':
            return c('collider_2025: Compaction').t`dropped old messages`;
        case 'llm_summary':
            return c('collider_2025: Compaction').t`summarized the conversation`;
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
    <div className="compaction-marker-markdown">
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

    const filesLabel = c('collider_2025: Compaction').t`Files from summarized messages`;
    const clearedToolsLabel = c('collider_2025: Compaction').t`Tool output cleared`;
    const droppedToolsLabel = c('collider_2025: Compaction').t`Tool calls removed`;
    const auditHeading = c('collider_2025: Compaction').t`No longer sent to the model`;

    return (
        <div className="compaction-marker-audit px-3 py-2 border-bottom border-weak bg-norm">
            <p className="compaction-marker-audit-heading m-0 text-xs text-semibold color-norm">{auditHeading}</p>
            <ul className="compaction-marker-audit-list unstyled m-0 mt-2 flex flex-column gap-1 text-xs color-weak">
                {hasFiles && (
                    <li>
                        <span className="text-semibold color-norm">{filesLabel}: </span>
                        {audit.removedFiles.join(', ')}
                    </li>
                )}
                {hasClearedTools && (
                    <li>
                        <span className="text-semibold color-norm">{clearedToolsLabel}: </span>
                        {audit.clearedTools.join(', ')}
                    </li>
                )}
                {hasDroppedTools && (
                    <li>
                        <span className="text-semibold color-norm">{droppedToolsLabel}: </span>
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
        return deriveCompactionAudit(
            compaction.summarizedMessageIds,
            messagesById,
            Object.values(attachmentsById)
        );
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
                <div className="compaction-marker-card border border-weak rounded overflow-hidden bg-norm">
                    <span className="compaction-marker-bar w-full flex flex-nowrap items-center gap-2 bg-weak color-norm py-2 px-3 text-sm">
                        <CircleLoader size="small" className="shrink-0" />
                        <span className="flex-1 text-semibold">
                            {c('collider_2025: Compaction')
                                .t`This chat got long — summarizing earlier messages so we can keep going…`}
                        </span>
                    </span>
                </div>
            </div>
        );
    }

    const { stats, summary } = compaction;
    const removed = formatTokenCount(stats.tokensRemoved);
    const sections = parseSummarySections(summary);
    const strategySummary = stats.appliedStrategies.map(strategyLabel).join(' · ');

    const headline = c('collider_2025: Compaction').t`Chat shortened to keep going`;
    const reclaimed = c('collider_2025: Compaction').t`${removed} freed`;
    const condensed = c('collider_2025: Compaction').ngettext(
        msgid`${stats.summarizedMessageCount} earlier message condensed`,
        `${stats.summarizedMessageCount} earlier messages condensed`,
        stats.summarizedMessageCount
    );
    const summaryHeading = c('collider_2025: Compaction').t`What ${LUMO_SHORT_APP_NAME} still remembers`;

    return (
        <div className="compaction-marker flex-1 w-full min-w-0 my-4" data-testid="compaction-marker">
            <div
                className="compaction-marker-card border border-weak rounded overflow-hidden bg-norm text-sm"
                data-expanded={expanded ? 'true' : 'false'}
            >
                <button
                    type="button"
                    className="compaction-marker-bar w-full flex flex-nowrap items-center gap-2 bg-weak color-norm text-left py-2 px-3"
                    onClick={() => setExpanded((v) => !v)}
                    aria-expanded={expanded}
                >
                    <IcArrowsToCenter className="shrink-0 color-weak" />
                    <span className="flex-1 text-semibold">{headline}</span>
                    <span className="compaction-marker-badge bg-strong color-weak text-sm py-0.5 px-1 rounded-sm text-nowrap">
                        {reclaimed}
                    </span>
                    {expanded ? (
                        <IcChevronUp className="shrink-0 color-weak" />
                    ) : (
                        <IcChevronDown className="shrink-0 color-weak" />
                    )}
                </button>

                {expanded && (
                    <div className="compaction-marker-details border-top border-weak">
                        <p className="compaction-marker-meta m-0 px-3 py-2 text-xs color-weak border-bottom border-weak">
                            {condensed}
                            {strategySummary && (
                                <>
                                    <span aria-hidden="true"> · </span>
                                    {strategySummary}
                                </>
                            )}
                        </p>

                        {audit && <CompactionAuditDetails audit={audit} />}

                        <div className="compaction-marker-scroll overflow-y-auto max-h-custom px-3 py-3" style={scrollStyle}>
                            <p className="compaction-marker-summary-label m-0 pb-2 text-xs text-semibold color-norm">
                                {summaryHeading}
                            </p>

                            {sections.length > 0 ? (
                                <ol className="compaction-marker-sections unstyled m-0 flex flex-column gap-2">
                                    {sections.map((section, index) => (
                                        <li key={index} className="compaction-marker-section bg-weak rounded p-3">
                                            <CompactionSummaryMarkdown
                                                content={sectionToMarkdown(section)}
                                                message={message}
                                            />
                                        </li>
                                    ))}
                                </ol>
                            ) : (
                                <div className="compaction-marker-fallback bg-weak rounded p-3">
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
export default CompactionMarker;
