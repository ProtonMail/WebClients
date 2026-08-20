import { useState } from 'react';
import type { ReactNode } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';

import type { ToolCallAnnouncement, ToolCallData } from '../../../../../../lib/toolCall/types';
import { isNativeToolCallData } from '../../../../../../lib/toolCall/types';
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
    if (isNativeToolCallData(toolCall)) {
        if (toolCall.name.startsWith('filesystem__')) {
            return 'Folder';
        }
        if (toolCall.name.startsWith('bash__')) {
            return 'Terminal';
        }
        if (toolCall.name.startsWith('browser__')) {
            return 'Globe';
        }
        if (toolCall.name.startsWith('slack__')) {
            return 'MessageSquare';
        }
        if (toolCall.name.startsWith('confluence__')) {
            return 'FileText';
        }
        return 'Wrench';
    }

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
function getNativeToolCallLabel(name: string, args: Record<string, unknown>): [string, string] {
    const argStr = (key: string) => (typeof args[key] === 'string' ? (args[key] as string) : '');

    if (name === 'filesystem__fs_search') {
        const query = argStr('query') || 'files';
        return [`Searching files for "${query}"...`, `Searched files for "${query}" and sent results back`];
    }
    if (name === 'filesystem__fs_read') {
        const path = argStr('path') || 'file';
        return [`Reading ${path}...`, `Read ${path} and sent contents back`];
    }
    if (name === 'filesystem__fs_write') {
        const path = argStr('path') || 'file';
        return [`Writing ${path}...`, `Updated ${path}`];
    }
    if (name === 'filesystem__fs_edit') {
        const path = argStr('path') || 'file';
        return [`Editing ${path}...`, `Edited ${path}`];
    }
    if (name === 'bash__run') {
        const command = argStr('command') || 'command';
        const short = command.length > 60 ? `${command.slice(0, 57)}...` : command;
        return [`Running \`${short}\`...`, `Ran command and sent output back`];
    }
    if (name === 'browser__fetch' || name === 'browser__navigate') {
        const url = argStr('url') || 'page';
        return [`Fetching ${url}...`, `Fetched ${url} and sent contents back`];
    }

    const shortName = name.includes('__') ? name.split('__').slice(1).join('__') : name;
    return [`Running ${shortName}...`, `Ran ${shortName} and sent results back`];
}

function getToolCallLabel(toolCall: ToolCallData | ToolCallAnnouncement): [string, string] {
    if (isNativeToolCallData(toolCall)) {
        const args = 'arguments' in toolCall ? toolCall.arguments : {};
        return getNativeToolCallLabel(toolCall.name, args);
    }

    switch (toolCall.name) {
        case 'web_search': {
            const query = toolCall.arguments?.query;
            return query
                ? [`Searching the web for "${query}"...`, `Searched the web for "${query}"`]
                : ['Searching the web...', 'Searched the web'];
        }
        case 'weather': {
            const loc = toolCall.arguments?.location;
            const location = loc ? ('city' in loc ? loc.city : `${loc.lat}, ${loc.lon}`) : undefined;
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
                    style={{
                        opacity: getTraceLineOpacity(index, visibleLines.length),
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical',
                    }}
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

function getReasoningStepLabel(): string {
    return c('collider_2025:Reasoning').t`Reasoning`;
}

function getToolCallShortLabel(toolCall: ToolCallData | ToolCallAnnouncement): [string, string] {
    if (isNativeToolCallData(toolCall)) {
        if (toolCall.name === 'filesystem__fs_search') {
            return ['Searching files...', 'Searched files'];
        }
        if (toolCall.name === 'filesystem__fs_read') {
            return ['Reading file...', 'Read file'];
        }
        if (toolCall.name === 'filesystem__fs_write') {
            return ['Writing file...', 'Updated file'];
        }
        if (toolCall.name === 'filesystem__fs_edit') {
            return ['Editing file...', 'Edited file'];
        }
        if (toolCall.name === 'bash__run') {
            return ['Running command...', 'Ran command'];
        }
        if (toolCall.name === 'browser__fetch' || toolCall.name === 'browser__navigate') {
            return ['Fetching page...', 'Fetched page'];
        }

        const shortName = toolCall.name.includes('__') ? toolCall.name.split('__').slice(1).join('__') : toolCall.name;
        return [`Running ${shortName}...`, `Ran ${shortName}`];
    }

    switch (toolCall.name) {
        case 'web_search':
            return ['Searching the web...', 'Searched the web'];
        case 'weather':
            return ['Checking the weather...', 'Checked the weather'];
        case 'stock':
            return ['Looking up stock prices...', 'Looked up stock prices'];
        case 'cryptocurrency':
            return ['Checking cryptocurrency prices...', 'Checked cryptocurrency prices'];
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

function getToolCallStateLabel(toolCall: ToolCallData | ToolCallAnnouncement, isActive: boolean): string {
    const [presentLabel, pastLabel] = getToolCallShortLabel(toolCall);
    return isActive ? presentLabel : pastLabel;
}

function getNativeToolCallContentLines(name: string, args: Record<string, unknown>): string[] {
    const argStr = (key: string) => (typeof args[key] === 'string' ? (args[key] as string) : '');

    if (name === 'filesystem__fs_search') {
        const query = argStr('query');
        return query ? [query] : [];
    }
    if (name === 'filesystem__fs_read' || name === 'filesystem__fs_write' || name === 'filesystem__fs_edit') {
        const path = argStr('path');
        return path ? [path] : [];
    }
    if (name === 'bash__run') {
        const command = argStr('command');
        if (!command) return [];
        return [command.length > 120 ? `${command.slice(0, 117)}...` : command];
    }
    if (name === 'browser__fetch' || name === 'browser__navigate') {
        const url = argStr('url');
        return url ? [url] : [];
    }

    return [];
}

const ThinkingStepTrack = ({ children }: { children: ReactNode }) => (
    <div className="thinking-step-track flex flex-nowrap justify-center items-start">{children}</div>
);

const ThinkingStepLabel = ({ children, isActive }: { children: ReactNode; isActive?: boolean }) => (
    <p className={clsx('thinking-step-label m-0 text-rg lh130', isActive ? 'color-norm' : 'color-weak')}>{children}</p>
);

const ThinkingStepBodyLines = ({ lines }: { lines: string[] }) => {
    if (lines.length === 0) {
        return null;
    }

    return (
        <div className="thinking-step-body flex flex-column gap-0.5 min-w-0">
            {lines.map((line, index) => (
                <p key={`${index}-${line.slice(-24)}`} className="thinking-step-body-line m-0 color-weak text-rg lh130">
                    {line}
                </p>
            ))}
        </div>
    );
};

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
                    width={16}
                    height={16}
                    className={clsx(
                        'thinking-step-icon-badge shrink-0',
                        isActive && 'thinking-step-icon-badge--active'
                    )}
                />
            </ThinkingStepTrack>

            <div className="thinking-step-content thinking-step-content--reasoning min-w-0 text-rg lh130">
                <ThinkingStepLabel isActive={isActive}>{getReasoningStepLabel()}</ThinkingStepLabel>
                <div className="thinking-step-body min-w-0">
                    <LazyProgressiveMarkdownRenderer
                        content={content}
                        isStreaming={isActive}
                        handleLinkClick={handleLinkClick}
                        message={message}
                    />
                </div>
            </div>
        </div>
    );
};

const DoneStep = () => (
    <div className="thinking-step">
        <ThinkingStepTrack>
            <LumoIcon
                name="Check"
                width={16}
                height={16}
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

interface WebExtractFailedUrl {
    url: string;
    error?: string;
}

interface WebExtractResult {
    type: 'WebExtract' | string;
    results: WebExtractResultItem[];
    failedUrls: WebExtractFailedUrl[];
}

const normalizeWebExtractFailedUrl = (item: unknown): WebExtractFailedUrl | null => {
    if (typeof item === 'string') {
        return { url: item };
    }

    if (typeof item === 'object' && item !== null && 'url' in item) {
        const failedItem = item as { url: unknown; error?: unknown };

        if (typeof failedItem.url !== 'string') {
            return null;
        }

        return {
            url: failedItem.url,
            error: typeof failedItem.error === 'string' ? failedItem.error : undefined,
        };
    }

    return null;
};

const parseWebExtractResult = (result: string): WebExtractResult | null => {
    try {
        const parsed = JSON.parse(result) as {
            type?: string;
            results?: WebExtractResultItem[];
            failed_urls?: unknown[];
        };

        if (parsed.type === 'WebExtract' && Array.isArray(parsed.results)) {
            const failedUrls = Array.isArray(parsed.failed_urls)
                ? parsed.failed_urls
                      .map(normalizeWebExtractFailedUrl)
                      .filter((failedUrl): failedUrl is WebExtractFailedUrl => failedUrl !== null)
                : [];

            return {
                type: parsed.type,
                results: parsed.results,
                failedUrls,
            };
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

function getToolCallContentLines(toolCall: ToolCallData | ToolCallAnnouncement, result?: string): string[] {
    if (isNativeToolCallData(toolCall)) {
        const args = 'arguments' in toolCall ? toolCall.arguments : {};
        return getNativeToolCallContentLines(toolCall.name, args);
    }

    const lines: string[] = [];

    if (toolCall.name === 'web_search') {
        const query = toolCall.arguments?.query;
        if (typeof query === 'string' && query.trim()) {
            lines.push(query.trim());
        }
        if (result) {
            const webSearchResults = parseWebSearchResults(result);
            webSearchResults?.results.forEach((searchResult) => {
                lines.push(searchResult.url);
            });
        }
        return lines;
    }

    if (toolCall.name === 'web_extract' && result) {
        const webExtractResult = parseWebExtractResult(result);
        webExtractResult?.results.forEach((item) => lines.push(item.url));
        webExtractResult?.failedUrls.forEach((failedUrl) => lines.push(failedUrl.url));
        return lines;
    }

    if (toolCall.name === 'weather') {
        const loc = toolCall.arguments?.location;
        const location = loc ? ('city' in loc ? loc.city : `${loc.lat}, ${loc.lon}`) : undefined;
        return location ? [location] : [];
    }

    if (toolCall.name === 'stock' || toolCall.name === 'cryptocurrency') {
        const symbol = toolCall.arguments?.symbol;
        return typeof symbol === 'string' && symbol.trim() ? [symbol.trim()] : [];
    }

    return lines;
}

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
    const stateLabel = getToolCallStateLabel(toolCall, isActive);
    const contentLines = getToolCallContentLines(toolCall, result);
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
    const isNativeDesktopTool = isNativeToolCallData(toolCall);
    const showNativeComplete = isNativeDesktopTool && !isActive && hasDetails;

    const hasInlineImageStatus = imageToolResult !== null && !isActive;
    const hasError = imageToolResult?.error === true;

    return (
        <div className="thinking-step">
            <ThinkingStepTrack>
                <LumoIcon
                    name={iconName}
                    width={16}
                    height={16}
                    className={clsx(
                        'thinking-step-icon-badge shrink-0',
                        isActive && 'thinking-step-icon-badge--active',
                        hasError && 'thinking-step-icon-badge--error'
                    )}
                />
            </ThinkingStepTrack>

            <div className="thinking-step-content min-w-0 text-rg lh130">
                {hasInlineCard && !isActive ? (
                    <>
                        <ThinkingStepLabel isActive={isActive}>{stateLabel}</ThinkingStepLabel>
                        <ThinkingStepBodyLines lines={contentLines} />
                        <div className={clsx(toolStepToggleClassName, 'cursor-default mt-1')}>
                            <span className="text-sm color-weak">{c('collider_2025:Reasoning').t`Complete`}</span>
                            <LumoIcon
                                name="Check"
                                width={12}
                                height={12}
                                className="thinking-step-complete-check shrink-0"
                            />
                        </div>
                    </>
                ) : hasInlineImageStatus ? (
                    <>
                        <ThinkingStepLabel isActive={isActive}>{stateLabel}</ThinkingStepLabel>
                        <ThinkingStepBodyLines lines={contentLines} />
                        <div className={clsx(toolStepToggleClassName, 'cursor-default mt-1')}>
                            <span className={hasError ? 'color-danger text-sm' : 'text-sm color-weak'}>
                                {hasError
                                    ? c('collider_2025:Reasoning').t`Failed`
                                    : c('collider_2025:Reasoning').t`Complete`}
                            </span>
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
                    </>
                ) : showNativeComplete ? (
                    <>
                        <ThinkingStepLabel isActive={isActive}>{stateLabel}</ThinkingStepLabel>
                        <ThinkingStepBodyLines lines={contentLines} />
                        {isExpanded && (
                            <div className="thinking-step-details mt-2 text-rg lh130">
                                <pre className="text-sm m-0 whitespace-pre-wrap">{result}</pre>
                            </div>
                        )}
                        {!isExpanded && (
                            <button
                                className={clsx(toolStepToggleClassName, 'cursor-pointer mt-1')}
                                onClick={() => setIsExpanded(true)}
                                type="button"
                            >
                                <span className="text-sm color-weak">View tool result</span>
                                <LumoIcon name="ChevronDown" width={12} height={12} />
                            </button>
                        )}
                    </>
                ) : hasDetails ? (
                    <>
                        <ThinkingStepLabel isActive={isActive}>{stateLabel}</ThinkingStepLabel>
                        {!isExpanded && <ThinkingStepBodyLines lines={contentLines} />}
                        <button
                            className={clsx(toolStepToggleClassName, 'cursor-pointer', !isExpanded && 'mt-1')}
                            onClick={() => setIsExpanded(!isExpanded)}
                            type="button"
                            aria-expanded={isExpanded}
                        >
                            <span className="text-sm color-weak">
                                {isExpanded
                                    ? c('collider_2025:Reasoning').t`Hide details`
                                    : c('collider_2025:Reasoning').t`View details`}
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
                                        {webExtractResult.results.length + webExtractResult.failedUrls.length}{' '}
                                        {webExtractResult.results.length + webExtractResult.failedUrls.length === 1
                                            ? 'URL'
                                            : 'URLs'}
                                        {webExtractResult.failedUrls.length > 0 && (
                                            <span className="color-danger ml-1">
                                                · {webExtractResult.failedUrls.length} failed
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
                                        {webExtractResult.failedUrls.map((failedUrl, idx) => (
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
                                                        {failedUrl.url}
                                                    </p>
                                                    <p className="text-xs color-weak m-0">
                                                        {failedUrl.error ??
                                                            c('collider_2025: Web Extract').t`Failed to extract`}
                                                    </p>
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
                    <>
                        <ThinkingStepLabel isActive={isActive}>{stateLabel}</ThinkingStepLabel>
                        <ThinkingStepBodyLines lines={contentLines} />
                    </>
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
