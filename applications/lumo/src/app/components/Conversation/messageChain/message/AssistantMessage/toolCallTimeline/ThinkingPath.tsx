import { useState } from 'react';
import type { ReactNode } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Icon } from '@proton/components';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import { IcLightbulb } from '@proton/icons/icons/IcLightbulb';
import type { IconName } from '@proton/icons/types';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import type { ToolCallData } from '../../../../../../lib/toolCall/types';
import type { Message } from '../../../../../../types';
import { LazyProgressiveMarkdownRenderer } from '../../../../../LumoMarkdown/LazyMarkdownComponents';
import { getThinkingPathHeader } from './thinkingPathLabels';
import { ThinkingProgressDots } from './ThinkingProgressDots';
import { useThinkingHeaderAnimation } from './useThinkingHeaderAnimation';

import './ThinkingPath.scss';

/**
 * Get icon name for tool call type.
 */
function getToolCallIcon(toolCall: ToolCallData): string {
    switch (toolCall.name) {
        case 'web_search':
            return 'globe';
        case 'weather':
            return 'cloud';
        case 'stock':
        case 'cryptocurrency':
            return 'chart-line';
        case 'describe_image':
        case 'generate_image':
        case 'edit_image':
            return 'image';
        case 'proton_info':
            return 'brand-proton';
        default:
            return 'wrench';
    }
}

/**
 * Get human-readable label for tool call with details.
 * Returns [presentTense, pastTense] tuple.
 */
function getToolCallLabel(toolCall: ToolCallData): [string, string] {
    switch (toolCall.name) {
        case 'web_search':
            const query = toolCall.arguments.query;
            return [`Searching the web for "${query}"...`, `Searched the web for "${query}"`];
        case 'weather':
            const location =
                'city' in toolCall.arguments.location
                    ? toolCall.arguments.location.city
                    : `${toolCall.arguments.location.lat}, ${toolCall.arguments.location.lon}`;
            return [`Checking the weather in ${location}...`, `Checked the weather in ${location}`];
        case 'stock':
            return [
                `Looking up ${toolCall.arguments.symbol} stock prices...`,
                `Looked up ${toolCall.arguments.symbol} stock prices`,
            ];
        case 'cryptocurrency':
            return [
                `Checking ${toolCall.arguments.symbol} cryptocurrency prices...`,
                `Checked ${toolCall.arguments.symbol} cryptocurrency prices`,
            ];
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
    | { type: 'tool_call'; toolCall: ToolCallData; result?: string; isActive: boolean };

interface ThinkingPathProps {
    steps: ThinkingStep[];
    message: Message;
    handleLinkClick?: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
}

function hasActiveThinkingStep(steps: ThinkingStep[]): boolean {
    return steps.some((step) => (step.type === 'reasoning' || step.type === 'tool_call') && step.isActive);
}

function getVisibleStepCount(steps: ThinkingStep[]): number {
    return steps.filter((step) => step.type !== 'reasoning' || step.content.trim()).length;
}

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

const ThinkingStepTrack = ({
    isFirst,
    isLast,
    children,
}: {
    isFirst: boolean;
    isLast: boolean;
    children: ReactNode;
}) => (
    <div
        className={clsx(
            'thinking-step-track',
            isFirst && 'thinking-step-track--first',
            isLast && 'thinking-step-track--last'
        )}
    >
        {children}
    </div>
);

const ReasoningContent = ({
    content,
    isActive,
    isFirst,
    isLast,
    message,
    handleLinkClick,
}: {
    content: string;
    isActive: boolean;
    isFirst: boolean;
    isLast: boolean;
    message: Message;
    handleLinkClick?: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
}) => {
    if (!content.trim()) {
        return null;
    }

    return (
        <div className="thinking-step">
            <ThinkingStepTrack isFirst={isFirst} isLast={isLast}>
                <IcLightbulb
                    size={3}
                    className={clsx('thinking-step-icon-badge', isActive && 'thinking-step-icon-badge--active')}
                />
            </ThinkingStepTrack>

            <div className="thinking-step-content thinking-step-content--reasoning">
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

const DoneStep = ({ isFirst, isLast }: { isFirst: boolean; isLast: boolean }) => (
    <div className="thinking-step">
        <ThinkingStepTrack isFirst={isFirst} isLast={isLast}>
            <IcCheckmark size={3} className="thinking-step-icon-badge thinking-step-icon-badge--done" />
        </ThinkingStepTrack>

        <div className="thinking-step-content">
            <span className="thinking-step-label color-hint">{c('collider_2025:Reasoning').t`Done`}</span>
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

const ToolCallStep = ({
    toolCall,
    result,
    isActive,
    isFirst,
    isLast,
    message,
    handleLinkClick,
}: {
    toolCall: ToolCallData;
    result?: string;
    isActive: boolean;
    isFirst: boolean;
    isLast: boolean;
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
            <ThinkingStepTrack isFirst={isFirst} isLast={isLast}>
                <Icon
                    name={iconName as IconName}
                    size={3}
                    className={clsx(
                        'thinking-step-icon-badge',
                        isActive && 'thinking-step-icon-badge--active',
                        hasError && 'thinking-step-icon-badge--error'
                    )}
                />
            </ThinkingStepTrack>

            <div className="thinking-step-content">
                {/* eslint-disable-next-line no-nested-ternary */}
                {hasInlineCard && !isActive ? (
                    <div className="thinking-step-toggle" style={{ cursor: 'default' }}>
                        <span className="thinking-step-label color-weak">{label}</span>
                        <IcCheckmarkCircleFilled size={3} className="color-success shrink-0" />
                    </div>
                ) : // eslint-disable-next-line no-nested-ternary
                hasInlineImageStatus ? (
                    <div className="thinking-step-toggle" style={{ cursor: 'default' }}>
                        <span className={clsx('thinking-step-label', hasError ? 'color-danger' : 'color-weak')}>
                            {label}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                            {imageToolResult!.elapsed_ms !== undefined && (
                                <span className="text-sm color-weak">
                                    ({(imageToolResult!.elapsed_ms / 1000).toFixed(1)}s)
                                </span>
                            )}
                            {hasError ? (
                                <IcExclamationCircleFilled size={3} className="color-danger" />
                            ) : (
                                <IcCheckmarkCircleFilled size={3} className="color-success" />
                            )}
                        </div>
                    </div>
                ) : hasDetails ? (
                    <>
                        <button
                            className="thinking-step-toggle"
                            onClick={() => setIsExpanded(!isExpanded)}
                            type="button"
                            aria-expanded={isExpanded}
                        >
                            <span
                                className={clsx(
                                    'thinking-step-label',
                                    // eslint-disable-next-line no-nested-ternary
                                    isActive ? 'color-norm' : hasError ? 'color-danger' : 'color-weak'
                                )}
                            >
                                {label}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                                {hasError && (
                                    <span className="flex items-center gap-1 text-sm color-danger">
                                        <IcExclamationCircleFilled size={3} />
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
                                <IcChevronDown
                                    size={3}
                                    className={clsx(
                                        'thinking-step-chevron',
                                        isExpanded && 'thinking-step-chevron--expanded'
                                    )}
                                />
                            </div>
                        </button>

                        {isExpanded && (
                            <div className="thinking-step-details">
                                {/* eslint-disable-next-line no-nested-ternary */}
                                {webExtractResult ? (
                                    <div className="flex flex-column gap-2">
                                        {webExtractResult.results.map((item, idx) => (
                                            <div key={idx} className="pb-2 last:pb-0 flex items-start gap-2">
                                                <IcCheckmarkCircleFilled
                                                    size={3}
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
                                                <IcExclamationCircleFilled
                                                    size={3}
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
                                ) : // eslint-disable-next-line no-nested-ternary
                                webSearchResults ? (
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
                                                <p className="text-sm color-weak m-0 line-clamp-2">
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
                    <p className={clsx('thinking-step-label m-0', isActive ? 'color-norm' : 'color-weak')}>{label}</p>
                )}
            </div>
        </div>
    );
};

export const ThinkingPath = ({ steps, message, handleLinkClick }: ThinkingPathProps) => {
    const displaySteps = mergeConsecutiveReasoningSteps(steps);

    if (displaySteps.length === 0) return null;

    const isThinking = hasActiveThinkingStep(displaySteps);
    const [isExpanded, setIsExpanded] = useState(false);
    const showDone = !isThinking;
    const animatedHeader = useThinkingHeaderAnimation(isThinking, message.id);
    const headerLabel = isThinking
        ? animatedHeader
        : getThinkingPathHeader(displaySteps, message.id, false);
    const visibleStepCount = getVisibleStepCount(displaySteps);
    const totalTimelineItems = visibleStepCount + (showDone ? 1 : 0);
    let timelineIndex = 0;

    const getTimelinePosition = () => {
        const isFirst = timelineIndex === 0;
        const isLast = timelineIndex === totalTimelineItems - 1;
        timelineIndex += 1;
        return { isFirst, isLast };
    };

    return (
        <div className="thinking-path">
            <button
                className={clsx('thinking-path-header', isThinking && 'thinking-path-header--active')}
                onClick={() => setIsExpanded(!isExpanded)}
                type="button"
                aria-expanded={isExpanded}
                aria-busy={isThinking}
            >
                <span className="thinking-path-header-spacer" aria-hidden="true" />
                <span className="thinking-path-header-label">
                    <span className={clsx(isThinking && 'thinking-path-header-scramble')}>{headerLabel}</span>
                    {isThinking && <ThinkingProgressDots />}
                </span>
                <IcChevronDown
                    size={3}
                    className={clsx(
                        'thinking-path-header-chevron',
                        isExpanded && 'thinking-path-header-chevron--expanded'
                    )}
                />
            </button>

            {isExpanded && (
                <div className="thinking-path-steps">
                    {displaySteps.map((step, idx) => {
                        if (step.type === 'reasoning') {
                            if (!step.content.trim()) {
                                return null;
                            }

                            const { isFirst, isLast } = getTimelinePosition();

                            return (
                                <ReasoningContent
                                    key={`reasoning-${idx}-${step.isActive}`}
                                    content={step.content}
                                    isActive={step.isActive}
                                    isFirst={isFirst}
                                    isLast={isLast}
                                    message={message}
                                    handleLinkClick={handleLinkClick}
                                />
                            );
                        }

                        const { isFirst, isLast } = getTimelinePosition();

                        return (
                            <ToolCallStep
                                key={idx}
                                toolCall={step.toolCall}
                                result={step.result}
                                isActive={step.isActive}
                                isFirst={isFirst}
                                isLast={isLast}
                                message={message}
                                handleLinkClick={handleLinkClick}
                            />
                        );
                    })}

                    {showDone && <DoneStep isFirst={visibleStepCount === 0} isLast />}
                </div>
            )}
        </div>
    );
};
