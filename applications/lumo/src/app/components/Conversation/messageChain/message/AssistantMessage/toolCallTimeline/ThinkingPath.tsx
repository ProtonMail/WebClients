import { useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Icon } from '@proton/components';

import type { ToolCallData } from '../../../../../../lib/toolCall/types';
import type { Message } from '../../../../../../types';
import { LazyProgressiveMarkdownRenderer } from '../../../../../LumoMarkdown/LazyMarkdownComponents';

import './ThinkingPath.scss';
import type { IconName } from '@proton/icons/types';

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
            return [
                `Searching the web for "${query}"...`,
                `Searched the web for "${query}"`
            ];
        case 'weather':
            const location = 'city' in toolCall.arguments.location
                ? toolCall.arguments.location.city
                : `${toolCall.arguments.location.lat}, ${toolCall.arguments.location.lon}`;
            return [
                `Checking the weather in ${location}...`,
                `Checked the weather in ${location}`
            ];
        case 'stock':
            return [
                `Looking up ${toolCall.arguments.symbol} stock prices...`,
                `Looked up ${toolCall.arguments.symbol} stock prices`
            ];
        case 'cryptocurrency':
            return [
                `Checking ${toolCall.arguments.symbol} cryptocurrency prices...`,
                `Checked ${toolCall.arguments.symbol} cryptocurrency prices`
            ];
        case 'describe_image':
            return ['Looking at your image...', 'Looked at your image'];
        case 'generate_image':
            const prompt = toolCall.arguments.prompt;
            const shortPrompt = prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt;
            return [
                `Generating image: "${shortPrompt}"...`,
                `Generated image: "${shortPrompt}"`
            ];
        case 'edit_image':
            const editPrompt = toolCall.arguments.prompt;
            const shortEditPrompt = editPrompt.length > 50 ? editPrompt.substring(0, 50) + '...' : editPrompt;
            return [
                `Editing image: "${shortEditPrompt}"...`,
                `Edited image: "${shortEditPrompt}"`
            ];
        case 'proton_info':
            return ['Checking Proton knowledge...', 'Checked Proton knowledge'];
        default:
            return ['Executing tool...', 'Executed tool'];
    }
}

export type ThinkingStep =
    | { type: 'reasoning'; content: string; isActive: boolean }
    | { type: 'tool_call'; toolCall: ToolCallData; result?: string; isActive: boolean };

interface ThinkingPathProps {
    steps: ThinkingStep[];
    message: Message;
    handleLinkClick?: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
}

const ReasoningStep = ({
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
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className={clsx('thinking-step', isFirst && 'thinking-step--first', isLast && 'thinking-step--last')}>
            <div className="thinking-step-icon-container">
                <Icon
                    name="lightbulb"
                    size={3}
                    className={clsx('thinking-step-icon-badge', isActive && 'thinking-step-icon-badge--active')}
                />
            </div>

            <div className="thinking-step-content">
                <button
                    className="thinking-step-toggle"
                    onClick={() => setIsExpanded(!isExpanded)}
                    type="button"
                    aria-expanded={isExpanded}
                >
                    <span className="thinking-step-label">
                        {isActive
                            ? c('collider_2025:Reasoning').t`Thinking...`
                            : c('collider_2025:Reasoning').t`Thought about this`}
                    </span>
                    <Icon
                        name="chevron-down"
                        size={3}
                        className={clsx('thinking-step-chevron', isExpanded && 'thinking-step-chevron--expanded')}
                    />
                </button>

                {isExpanded && (
                    <div className="thinking-step-details">
                        <LazyProgressiveMarkdownRenderer
                            content={content}
                            isStreaming={false}
                            handleLinkClick={handleLinkClick}
                            message={message}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

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

const parseWebSearchResults = (result: string): WebSearchResults | null => {
    try {
        const parsed = JSON.parse(result);
        if (parsed.results && Array.isArray(parsed.results)) {
            return parsed as WebSearchResults;
        }
    } catch (e) {
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
    } catch (e) {
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
    const webSearchResults = hasDetails && toolCall.name === 'web_search'
        ? parseWebSearchResults(result)
        : null;
    const imageToolResult = hasDetails && (toolCall.name === 'describe_image' || toolCall.name === 'generate_image' || toolCall.name === 'edit_image')
        ? parseImageToolResult(result)
        : null;

    // Check if the tool call failed
    const hasError = imageToolResult?.error === true;

    return (
        <div className={clsx('thinking-step', isFirst && 'thinking-step--first', isLast && 'thinking-step--last')}>
            <div className="thinking-step-icon-container">
                <Icon
                    name={iconName as IconName}
                    size={3}
                    className={clsx(
                        'thinking-step-icon-badge',
                        isActive && 'thinking-step-icon-badge--active',
                        hasError && 'thinking-step-icon-badge--error'
                    )}
                />
            </div>

            <div className="thinking-step-content">
                {hasDetails ? (
                    <>
                        <button
                            className="thinking-step-toggle"
                            onClick={() => setIsExpanded(!isExpanded)}
                            type="button"
                            aria-expanded={isExpanded}
                        >
                            <span className={clsx('thinking-step-label', isActive ? 'color-norm' : hasError ? 'color-danger' : 'color-weak')}>
                                {label}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                                {hasError && (
                                    <span className="flex items-center gap-1 text-sm color-danger">
                                        <Icon name="exclamation-circle-filled" size={3} />
                                        Failed
                                    </span>
                                )}
                                {webSearchResults && webSearchResults.results.length > 0 && (
                                    <span className="text-sm color-weak">
                                        {webSearchResults.results.length} {webSearchResults.results.length === 1 ? 'result' : 'results'}
                                    </span>
                                )}
                                <Icon
                                    name="chevron-down"
                                    size={3}
                                    className={clsx('thinking-step-chevron', isExpanded && 'thinking-step-chevron--expanded')}
                                />
                            </div>
                        </button>

                        {isExpanded && (
                            <div className="thinking-step-details">
                                {webSearchResults ? (
                                    <div className="flex flex-column gap-2">
                                        {webSearchResults.results.map((result, idx) => (
                                            <div key={idx} className="pb-2 border-bottom border-weak last:border-0 last:pb-0">
                                                <a
                                                    href={result.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-semibold color-primary text-no-decoration hover:underline block mb-1"
                                                >
                                                    {result.title}
                                                </a>
                                                <p className="text-sm color-weak m-0 line-clamp-2">{result.description}</p>
                                                <p className="text-xs color-weak m-0 mt-1">{new URL(result.url).hostname}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : imageToolResult?.info ? (
                                    <div>
                                        <div className="mb-2 text-sm">
                                            <span className={clsx('text-semibold', imageToolResult.status === 'success' ? 'color-success' : 'color-danger')}>
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
                    <p className={clsx('thinking-step-label m-0', isActive ? 'color-norm' : 'color-weak')}>
                        {label}
                    </p>
                )}
            </div>
        </div>
    );
};

export const ThinkingPath = ({ steps, message, handleLinkClick }: ThinkingPathProps) => {
    if (steps.length === 0) return null;

    return (
        <div className="thinking-path">
            {steps.map((step, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === steps.length - 1;

                if (step.type === 'reasoning') {
                    return (
                        <ReasoningStep
                            key={idx}
                            content={step.content}
                            isActive={step.isActive}
                            isFirst={isFirst}
                            isLast={isLast}
                            message={message}
                            handleLinkClick={handleLinkClick}
                        />
                    );
                } else {
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
                }
            })}
        </div>
    );
};
