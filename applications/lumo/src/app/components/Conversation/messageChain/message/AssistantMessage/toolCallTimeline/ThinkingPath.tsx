import { useState } from 'react';
import type { ReactNode } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';

import type { ToolCallAnnouncement, ToolCallData } from '../../../../../../lib/toolCall/types';
import type { Message } from '../../../../../../types';
import { type IconName, LumoIcon } from '../../../../../LumoIcon/LumoIcon';
import { LazyProgressiveMarkdownRenderer } from '../../../../../LumoMarkdown/LazyMarkdownComponents';
import { ThinkingProgressDots } from './ThinkingProgressDots';
import { getThinkingPathHeader } from './thinkingPathLabels';
import { useThinkingHeaderAnimation } from './useThinkingHeaderAnimation';

import './ThinkingPath.scss';

/**
 * Get icon name for tool call type.
 */
function getToolCallIcon(toolCall: ToolCallData | ToolCallAnnouncement): IconName {
    switch (toolCall.name) {
        case 'web_search':
            return 'Globe';
        case 'weather':
            return 'Cloud';
        case 'stock':
        case 'cryptocurrency':
            return 'TrendingUp';
        case 'describe_image':
        case 'generate_image':
        case 'edit_image':
            return 'Image';
        case 'proton_info':
            return 'Shield';
        default:
            return 'Wrench';
    }
}

/**
 * Get human-readable label for tool call with details.
 * Returns [presentTense, pastTense] tuple.
 */
function getToolCallLabel(toolCall: ToolCallData | ToolCallAnnouncement): [string, string] {
    switch (toolCall.name) {
        case 'web_search': {
            const query = toolCall.arguments?.query;
            return query
                ? [`Searching the web for "${query}"...`, `Searched the web for "${query}"`]
                : ['Searching the web...', 'Searched the web'];
        }
        case 'weather': {
            const loc = toolCall.arguments?.location;
            const location = loc
                ? 'city' in loc
                    ? loc.city
                    : `${loc.lat}, ${loc.lon}`
                : undefined;
            return location
                ? [`Checking the weather in ${location}...`, `Checked the weather in ${location}`]
                : ['Checking the weather...', 'Checked the weather'];
        }
        case 'stock': {
            const symbol = toolCall.arguments?.symbol;
            return symbol
                ? [`Looking up ${symbol} stock prices...`, `Looked up ${symbol} stock prices`]
                : ['Looking up stock prices...', 'Looked up stock prices'];
        }
        case 'cryptocurrency': {
            const symbol = toolCall.arguments?.symbol;
            return symbol
                ? [`Checking ${symbol} cryptocurrency prices...`, `Checked ${symbol} cryptocurrency prices`]
                : ['Checking cryptocurrency prices...', 'Checked cryptocurrency prices'];
        }
        case 'describe_image':
            return [
                c('collider_2025:Reasoning').t`Looking at your image...`,
                c('collider_2025:Reasoning').t`Looked at your image`,
            ];
        case 'generate_image':
            return [
                c('collider_2025:Reasoning').t`Generating image...`,
                c('collider_2025:Reasoning').t`Generated image`,
            ];
        case 'edit_image':
            return [c('collider_2025:Reasoning').t`Editing image...`, c('collider_2025:Reasoning').t`Edited image`];
        case 'proton_info':
            return [
                c('collider_2025:Reasoning').t`Checking ${BRAND_NAME} knowledge...`,
                c('collider_2025:Reasoning').t`Checked ${BRAND_NAME} knowledge`,
            ];
        case 'web_extract':
            return [
                c('collider_2025:Reasoning').t`Extracting content from page...`,
                c('collider_2025:Reasoning').t`Extracted page content`,
            ];
        default:
            return [c('collider_2025:Reasoning').t`Executing tool...`, c('collider_2025:Reasoning').t`Executed tool`];
    }
}

export type ThinkingStep =
    | { type: 'reasoning'; content: string; isActive: boolean; durationMs?: number }
    | { type: 'tool_call'; toolCall: ToolCallData | ToolCallAnnouncement; result?: string; isActive: boolean };

interface ThinkingPathProps {
    steps: ThinkingStep[];
    message: Message;
    isThinking: boolean;
    showThinkingTrace: boolean;
    handleLinkClick?: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
}

const THINKING_TRACE_LINE_COUNT = 5;

function stripMarkdownLine(line: string): string {
    return line
        .replace(/`([^`]+)`/g, '$1')
        .replace(/^#{1,6}\s+/, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/\*([^*\n]+)\*/g, '$1')
        .replace(/_([^_\n]+)_/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/^>\s?/, '')
        .replace(/^[-*+]\s+/, '')
        .replace(/^\d+\.\s+/, '')
        .trim();
}

function reasoningContentToLines(content: string): string[] {
    if (!content.trim()) {
        return [];
    }

    return content
        .split('\n')
        .map(stripMarkdownLine)
        .filter((line) => line.length > 0);
}

function buildThinkingTraceLines(steps: ThinkingStep[]): string[] {
    const lines: string[] = [];

    for (const step of steps) {
        if (step.type === 'reasoning') {
            lines.push(...reasoningContentToLines(step.content));
            continue;
        }

        const [presentLabel, pastLabel] = getToolCallLabel(step.toolCall);
        lines.push(step.isActive ? presentLabel : pastLabel);
    }

    const activeToolStep = [...steps]
        .reverse()
        .find(
            (step): step is Extract<ThinkingStep, { type: 'tool_call' }> => step.type === 'tool_call' && step.isActive
        );

    if (activeToolStep) {
        const [presentLabel] = getToolCallLabel(activeToolStep.toolCall);
        if (lines.at(-1) !== presentLabel) {
            lines.push(presentLabel);
        }
    }

    return lines;
}

function getTraceLineOpacity(index: number, total: number): number {
    if (total <= 1) {
        return 1;
    }

    const minOpacity = 0.2;
    return minOpacity + (index / (total - 1)) * (1 - minOpacity);
}

const ThinkingPathTrace = ({ lines }: { lines: string[] }) => {
    const visibleLines = lines.slice(-THINKING_TRACE_LINE_COUNT);

    if (visibleLines.length === 0) {
        return null;
    }

    return (
        <div className="thinking-path-trace" aria-hidden="true">
            {visibleLines.map((line, index) => (
                <p
                    key={`${index}-${line.slice(-24)}`}
                    className="thinking-path-trace-line m-0 color-weak text-rg lh130"
                    style={{ opacity: getTraceLineOpacity(index, visibleLines.length) }}
                >
                    {line}
                </p>
            ))}
        </div>
    );
};

function mergeConsecutiveReasoningSteps(steps: ThinkingStep[]): ThinkingStep[] {
    const merged: ThinkingStep[] = [];

    for (const step of steps) {
        if (step.type !== 'reasoning') {
            merged.push(step);
            continue;
        }

        const previous = merged[merged.length - 1];
        if (previous?.type === 'reasoning') {
            merged[merged.length - 1] = {
                ...previous,
                content: previous.content + step.content,
                isActive: step.isActive,
                durationMs: step.durationMs ?? previous.durationMs,
            };
            continue;
        }

        merged.push({ ...step });
    }

    return merged;
}

const ThinkingStepTrack = ({ children }: { children: ReactNode }) => (
    <div className="thinking-step-track flex flex-nowrap justify-center items-start">{children}</div>
);

const ReasoningContent = ({
    content,
    isActive,
    message,
    handleLinkClick,
}: {
    content: string;
    isActive: boolean;
    message: Message;
    handleLinkClick?: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
}) => {
    if (!content.trim()) {
        return null;
    }

    return (
        <div className="thinking-step">
            <ThinkingStepTrack>
                <LumoIcon
                    name="Lightbulb"
                    width={12}
                    height={12}
                    className={clsx(
                        'thinking-step-icon-badge shrink-0',
                        isActive && 'thinking-step-icon-badge--active'
                    )}
                />
            </ThinkingStepTrack>

            <div className="thinking-step-content thinking-step-content--reasoning min-w-0 text-rg lh130">
                <LazyProgressiveMarkdownRenderer
                    content={content}
                    isStreaming={isActive}
                    handleLinkClick={handleLinkClick}
                    message={message}
                />
            </div>
        </div>
    );
};

const DoneStep = () => (
    <div className="thinking-step">
        <ThinkingStepTrack>
            <LumoIcon
                name="Check"
                width={12}
                height={12}
                className="thinking-step-icon-badge thinking-step-icon-badge--done shrink-0"
            />
        </ThinkingStepTrack>

        <div className="thinking-step-content min-w-0 text-rg lh130">
            <span className="color-hint">{c('collider_2025:Reasoning').t`Done`}</span>
        </div>
    </div>
);

interface WebSearchResult {
    title: string;
    url: string;
    description: string;
    snippets?: string[];
    ref?: number;
}

interface WebSearchResults {
    results: WebSearchResult[];
    total_count?: number;
}

interface ImageToolResult {
    status: string;
    info?: string;
    elapsed_ms?: number;
    seed?: number | null;
    tool?: string;
    error?: boolean;
}

interface WebExtractResultItem {
    title: string;
    url: string;
    content: string;
}

interface WebExtractResult {
    type: 'WebExtract' | string;
    results: WebExtractResultItem[];
    failed_urls: string[];
}

const parseWebExtractResult = (result: string): WebExtractResult | null => {
    try {
        const parsed = JSON.parse(result);
        if (parsed.type === 'WebExtract' && Array.isArray(parsed.results)) {
            return parsed as WebExtractResult;
        }
    } catch {
        // Not valid JSON or not web extract format
    }
    return null;
};

const parseWebSearchResults = (result: string): WebSearchResults | null => {
    try {
        const parsed = JSON.parse(result);
        if (parsed.results && Array.isArray(parsed.results)) {
            return parsed as WebSearchResults;
        }
    } catch {
        // Not valid JSON or not web search format
    }
    return null;
};

const parseImageToolResult = (result: string): ImageToolResult | null => {
    try {
        const parsed = JSON.parse(result);
        if (parsed.status && parsed.tool) {
            return parsed as ImageToolResult;
        }
    } catch {
        // Not valid JSON or not image tool format
    }
    return null;
};

const toolStepToggleClassName =
    'thinking-step-toggle flex flex-nowrap items-center justify-space-between gap-2 w-full p-0 m-0 rounded border-none text-left bg-transparent hover:bg-weak color-weak text-rg lh130';

const ToolCallStep = ({
    toolCall,
    result,
    isActive,
    message,
    handleLinkClick,
}: {
    toolCall: ToolCallData | ToolCallAnnouncement;
    result?: string;
    isActive: boolean;
    message: Message;
    handleLinkClick?: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [presentLabel, pastLabel] = getToolCallLabel(toolCall);
    const label = isActive ? presentLabel : pastLabel;
    const iconName = getToolCallIcon(toolCall);

    const hasDetails = result && result.trim().length > 0;
    const webSearchResults = hasDetails && toolCall.name === 'web_search' ? parseWebSearchResults(result) : null;
    const imageToolResult =
        hasDetails &&
        (toolCall.name === 'describe_image' || toolCall.name === 'generate_image' || toolCall.name === 'edit_image')
            ? parseImageToolResult(result)
            : null;
    const webExtractResult = hasDetails && toolCall.name === 'web_extract' ? parseWebExtractResult(result) : null;
    const hasInlineCard =
        hasDetails &&
        (toolCall.name === 'stock' ||
            toolCall.name === 'cryptocurrency' ||
            toolCall.name === 'weather' ||
            toolCall.name === 'proton_info');

    const hasInlineImageStatus = imageToolResult !== null && !isActive;
    const hasError = imageToolResult?.error === true;

    return (
        <div className="thinking-step">
            <ThinkingStepTrack>
                <LumoIcon
                    name={iconName}
                    width={12}
                    height={12}
                    className={clsx(
                        'thinking-step-icon-badge shrink-0',
                        isActive && 'thinking-step-icon-badge--active',
                        hasError && 'thinking-step-icon-badge--error'
                    )}
                />
            </ThinkingStepTrack>

            <div className="thinking-step-content min-w-0 text-rg lh130">
                {}
                {hasInlineCard && !isActive ? (
                    <div className={clsx(toolStepToggleClassName, 'cursor-default')}>
                        <span className="color-weak">{label}</span>
                        <LumoIcon
                            name="Check"
                            width={12}
                            height={12}
                            className="thinking-step-complete-check shrink-0"
                        />
                    </div>
                ) : hasInlineImageStatus ? (
                    <div className={clsx(toolStepToggleClassName, 'cursor-default')}>
                        <span className={hasError ? 'color-danger' : 'color-weak'}>{label}</span>
                        <div className="flex items-center gap-2 shrink-0">
                            {imageToolResult!.elapsed_ms !== undefined && (
                                <span className="text-sm color-weak">
                                    ({(imageToolResult!.elapsed_ms / 1000).toFixed(1)}s)
                                </span>
                            )}
                            {hasError ? (
                                <LumoIcon name="CircleAlert" width={12} height={12} className="color-danger" />
                            ) : (
                                <LumoIcon
                                    name="Check"
                                    width={12}
                                    height={12}
                                    className="thinking-step-complete-check"
                                />
                            )}
                        </div>
                    </div>
                ) : hasDetails ? (
                    <>
                        <button
                            className={clsx(toolStepToggleClassName, 'cursor-pointer')}
                            onClick={() => setIsExpanded(!isExpanded)}
                            type="button"
                            aria-expanded={isExpanded}
                        >
                            <span className={isActive ? 'color-norm' : hasError ? 'color-danger' : 'color-weak'}>
                                {label}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                                {hasError && (
                                    <span className="flex items-center gap-1 text-sm color-danger">
                                        <LumoIcon name="CircleAlert" width={12} height={12} />
                                        Failed
                                    </span>
                                )}
                                {webSearchResults && webSearchResults.results.length > 0 && (
                                    <span className="text-sm color-weak">
                                        {webSearchResults.results.length}{' '}
                                        {webSearchResults.results.length === 1 ? 'result' : 'results'}
                                    </span>
                                )}
                                {webExtractResult && (
                                    <span className="text-sm color-weak">
                                        {webExtractResult.results.length + webExtractResult.failed_urls.length}{' '}
                                        {webExtractResult.results.length + webExtractResult.failed_urls.length === 1
                                            ? 'URL'
                                            : 'URLs'}
                                        {webExtractResult.failed_urls.length > 0 && (
                                            <span className="color-danger ml-1">
                                                · {webExtractResult.failed_urls.length} failed
                                            </span>
                                        )}
                                    </span>
                                )}
                                <LumoIcon
                                    name="ChevronDown"
                                    width={12}
                                    height={12}
                                    className={clsx(
                                        'thinking-step-chevron',
                                        isExpanded && 'thinking-step-chevron--expanded'
                                    )}
                                />
                            </div>
                        </button>

                        {isExpanded && (
                            <div className="thinking-step-details mt-2 text-rg lh130">
                                {}
                                {webExtractResult ? (
                                    <div className="flex flex-column gap-2">
                                        {webExtractResult.results.map((item, idx) => (
                                            <div key={idx} className="pb-2 last:pb-0 flex items-start gap-2">
                                                <LumoIcon
                                                    name="CircleCheck"
                                                    width={12}
                                                    height={12}
                                                    className="color-success shrink-0 mt-0.5"
                                                />
                                                <div className="min-w-0">
                                                    <a
                                                        href={item.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-semibold color-primary text-no-decoration hover:underline block mb-0.5"
                                                        onClick={(e) => handleLinkClick?.(e, item.url)}
                                                    >
                                                        {item.title || new URL(item.url).hostname}
                                                    </a>
                                                    <p className="text-xs color-weak m-0">
                                                        {new URL(item.url).hostname}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        {webExtractResult.failed_urls.map((url, idx) => (
                                            <div
                                                key={`failed-${idx}`}
                                                className="pb-2 border-bottom border-weak last:border-0 last:pb-0 flex items-start gap-2"
                                            >
                                                <LumoIcon
                                                    name="CircleAlert"
                                                    width={12}
                                                    height={12}
                                                    className="color-danger shrink-0 mt-0.5"
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-semibold color-danger m-0 mb-0.5 text-ellipsis overflow-hidden">
                                                        {url}
                                                    </p>
                                                    <p className="text-xs color-weak m-0">Failed to extract</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : webSearchResults ? (
                                    <div className="flex flex-column gap-2">
                                        {webSearchResults.results.map((searchResult, idx) => (
                                            <div
                                                key={idx}
                                                className="pb-2 border-bottom border-weak last:border-0 last:pb-0"
                                            >
                                                <a
                                                    href={searchResult.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-semibold color-primary text-no-decoration hover:underline block mb-1"
                                                    onClick={(e) => handleLinkClick?.(e, searchResult.url)}
                                                >
                                                    {searchResult.title}
                                                </a>
                                                <p className="text-sm color-weak m-0 text-ellipsis-two-lines">
                                                    {searchResult.description}
                                                </p>
                                                <p className="text-xs color-weak m-0 mt-1">
                                                    {new URL(searchResult.url).hostname}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : imageToolResult?.info ? (
                                    <div>
                                        <div className="mb-2 text-sm">
                                            <span
                                                className={clsx(
                                                    'text-semibold',
                                                    imageToolResult.status === 'success'
                                                        ? 'color-success'
                                                        : 'color-danger'
                                                )}
                                            >
                                                {imageToolResult.status === 'success' ? 'Success' : 'Failed'}
                                            </span>
                                            {imageToolResult.elapsed_ms && (
                                                <span className="color-weak ml-2">
                                                    ({(imageToolResult.elapsed_ms / 1000).toFixed(1)}s)
                                                </span>
                                            )}
                                        </div>
                                        <LazyProgressiveMarkdownRenderer
                                            content={imageToolResult.info}
                                            isStreaming={false}
                                            handleLinkClick={handleLinkClick}
                                            message={message}
                                        />
                                    </div>
                                ) : (
                                    <pre className="text-sm m-0 whitespace-pre-wrap">{result}</pre>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <p className={clsx('m-0', isActive ? 'color-norm' : 'color-weak')}>{label}</p>
                )}
            </div>
        </div>
    );
};

export const ThinkingPath = ({ steps, message, isThinking, showThinkingTrace, handleLinkClick }: ThinkingPathProps) => {
    const displaySteps = mergeConsecutiveReasoningSteps(steps);
    const [isExpanded, setIsExpanded] = useState(false);
    const isWaitingForSteps = displaySteps.length === 0 && isThinking;

    const activeHeader = getThinkingPathHeader(displaySteps, message.id, true);
    const completeHeader = getThinkingPathHeader(displaySteps, message.id, false);
    const animatedHeader = useThinkingHeaderAnimation(
        isThinking,
        message.id,
        isWaitingForSteps ? undefined : activeHeader
    );

    if (displaySteps.length === 0 && !isThinking) {
        return null;
    }

    const showDone = !isThinking;
    const headerLabel = isThinking ? animatedHeader || activeHeader : completeHeader;
    const traceLines = buildThinkingTraceLines(displaySteps);
    const showTrace = !isExpanded && showThinkingTrace && traceLines.length > 0;

    return (
        <div className="thinking-path">
            <button
                className={clsx(
                    'thinking-path-header w-full rounded border-none cursor-pointer text-left bg-transparent hover:bg-weak color-weak text-rg lh130',
                    isThinking && 'color-norm'
                )}
                onClick={() => setIsExpanded(!isExpanded)}
                type="button"
                aria-expanded={isExpanded}
                aria-busy={isThinking}
            >
                <span className="inline-flex flex-nowrap items-center min-w-0 text-ellipsis flex-1">
                    <span className={clsx(isThinking && 'text-tabular-nums')}>{headerLabel}</span>
                    {isThinking && <ThinkingProgressDots />}
                </span>
                <LumoIcon
                    name="ChevronDown"
                    width={12}
                    height={12}
                    className={clsx(
                        'thinking-path-header-chevron shrink-0 color-weak',
                        isExpanded && 'thinking-path-header-chevron--expanded',
                        isWaitingForSteps && 'visibility-hidden'
                    )}
                />
            </button>

            {showTrace && <ThinkingPathTrace lines={traceLines} />}

            {isExpanded && !isWaitingForSteps && (
                <div className="thinking-path-steps flex flex-nowrap flex-column gap-4 mt-2">
                    {displaySteps.map((step, idx) => {
                        if (step.type === 'reasoning') {
                            if (!step.content.trim()) {
                                return null;
                            }

                            return (
                                <ReasoningContent
                                    key={`reasoning-${idx}-${step.isActive}`}
                                    content={step.content}
                                    isActive={step.isActive}
                                    message={message}
                                    handleLinkClick={handleLinkClick}
                                />
                            );
                        }

                        return (
                            <ToolCallStep
                                key={idx}
                                toolCall={step.toolCall}
                                result={step.result}
                                isActive={step.isActive}
                                message={message}
                                handleLinkClick={handleLinkClick}
                            />
                        );
                    })}

                    {showDone && <DoneStep />}
                </div>
            )}
        </div>
    );
};
