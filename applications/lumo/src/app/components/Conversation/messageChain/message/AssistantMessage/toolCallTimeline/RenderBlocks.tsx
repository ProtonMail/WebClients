import { Suspense, lazy, useCallback, useState } from 'react';

import type { ContentBlock, Message, ThinkingTimelineEvent, ToolCallBlock } from '../../../../../../types';
import { isToolCallBlock, isToolResultBlock } from '../../../../../../types';
import StreamingMarkdownRenderer from '../../../../../LumoMarkdown/StreamingMarkdownRenderer';
import { parseToolCallBlock } from '../../toolCall/toolCallUtils';
import { ThinkingPath, type ThinkingStep } from './ThinkingPath';
import { WeatherToolResult, parseWeatherResult } from './WeatherToolResult';
import { type FinanceComparisonItem, parseFinanceResult } from './financeUtils';

// Recharts (~341KB) lives only inside these two components. Lazy-load them so a finance
// chart is fetched on demand (when a stock/crypto tool result renders) instead of sitting
// on the conversation-view first-paint critical path.
const FinanceComparisonResult = lazy(() =>
    import('./FinanceComparisonResult').then((m) => ({ default: m.FinanceComparisonResult }))
);
const FinanceToolResult = lazy(() => import('./FinanceToolResult').then((m) => ({ default: m.FinanceToolResult })));

const TurndownServiceModule = require('turndown');
// Handle both CommonJS and ES module exports
const TurndownService = TurndownServiceModule.default || TurndownServiceModule;

interface RenderBlocksProps {
    blocks: ContentBlock[];
    message: Message;
    isGenerating: boolean;
    isLastMessage: boolean;
    handleLinkClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
    sourcesContainerRef: React.MutableRefObject<HTMLDivElement | null>;
    messageContentContainerRef: React.MutableRefObject<HTMLDivElement | null>;
    reasoning?: string;
}

/**
 * Preprocesses content by converting HTML to Markdown if needed.
 * Sometimes the model replies in raw HTML which we need to convert.
 */
function preprocessContent(content: string | undefined): string {
    if (!content) return '';
    content = content.trim();
    if (
        content.startsWith('<div>') ||
        content.startsWith('<p>') ||
        content.endsWith('</div>') ||
        content.endsWith('</p>')
    ) {
        const turndownService = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced',
        });
        return turndownService.turndown(content);
    }
    return content;
}

/**
 * Check if a tool call is in progress (no result yet).
 */
function isToolCallInProgress(
    block: ToolCallBlock,
    allBlocks: ContentBlock[],
    isGenerating: boolean,
    isLastMessage: boolean
): boolean {
    if (!isGenerating || !isLastMessage) return false;

    const blockIndex = allBlocks.indexOf(block);
    const isLastToolCall = block === allBlocks.filter(isToolCallBlock)[allBlocks.filter(isToolCallBlock).length - 1];

    // Check if there's a result after this tool call
    const hasResult = allBlocks.some((b, idx) => idx > blockIndex && isToolResultBlock(b));

    return isLastToolCall && !hasResult;
}

/**
 * Convert a tool call block to timeline step data.
 */
function toToolCallStep(
    block: ToolCallBlock,
    allBlocks: ContentBlock[],
    isGenerating: boolean,
    isLastMessage: boolean
): ThinkingStep | null {
    const toolCall = parseToolCallBlock(block);
    if (!toolCall) return null;

    const isInProgress = isToolCallInProgress(block, allBlocks, isGenerating, isLastMessage);

    const blockIndex = allBlocks.indexOf(block);
    const resultBlock = allBlocks.find((b, idx) => idx > blockIndex && isToolResultBlock(b));
    const result = resultBlock?.type === 'tool_result' ? resultBlock.content : undefined;

    return { type: 'tool_call', toolCall, result, isActive: isInProgress };
}

type InterleavedItem = { type: 'steps'; steps: ThinkingStep[] } | { type: 'text'; block: ContentBlock };

const IMAGE_ATTACHMENT_MARKDOWN = /^!\[[^\]]*\]\(attachment:[^)]+\)$/;

function isImageAttachmentTextBlock(block: ContentBlock): boolean {
    return block.type === 'text' && IMAGE_ATTACHMENT_MARKDOWN.test(block.content.trim());
}

function isActiveThinkingStep(step: ThinkingStep): boolean {
    return (step.type === 'reasoning' || step.type === 'tool_call') && step.isActive;
}

/**
 * Build render items with all thinking steps grouped at the top and response
 * content below. Keeps the thinking path pinned while generation continues, even
 * when the model streams preamble text or image markdown mid-turn.
 */
function buildInterleavedItems(
    blocks: ContentBlock[],
    timeline: ThinkingTimelineEvent[] | undefined,
    reasoning: string | undefined,
    isGenerating: boolean,
    isLastMessage: boolean,
    messageCreatedAt?: string
): InterleavedItem[] {
    const toolCallBlocks = blocks.filter(isToolCallBlock);
    const textBlocks = blocks.filter((block) => block.type === 'text' && block.content.trim().length > 0);
    const result: InterleavedItem[] = [];
    const allSteps: ThinkingStep[] = [];

    const messageCreatedAtMs = messageCreatedAt ? new Date(messageCreatedAt).getTime() : undefined;

    if (timeline && timeline.length > 0) {
        const processedToolCallIndices = new Set<number>();

        const makeReasoningStep = (pos: number): ThinkingStep => {
            const event = timeline[pos] as { type: 'reasoning'; content: string; timestamp: number };
            const isLast = pos === timeline.length - 1;
            const isActive = isGenerating && isLastMessage && isLast;
            const nextEvent = timeline[pos + 1];
            let durationMs: number | undefined;
            if (!isActive) {
                if (nextEvent !== undefined) {
                    durationMs = nextEvent.timestamp - event.timestamp;
                } else if (messageCreatedAtMs !== undefined && messageCreatedAtMs > event.timestamp) {
                    durationMs = messageCreatedAtMs - event.timestamp;
                }
            }
            return { type: 'reasoning', content: event.content, isActive, durationMs };
        };

        for (let pos = 0; pos < timeline.length; pos++) {
            const event = timeline[pos];
            if (event.type === 'reasoning') {
                allSteps.push(makeReasoningStep(pos));
            } else if (event.type === 'tool_call' && !processedToolCallIndices.has(event.toolCallIndex)) {
                processedToolCallIndices.add(event.toolCallIndex);
                const block = toolCallBlocks[event.toolCallIndex];
                if (block) {
                    const step = toToolCallStep(block, blocks, isGenerating, isLastMessage);
                    if (step) allSteps.push(step);
                }
            }
        }

        toolCallBlocks.forEach((block, toolCallIdx) => {
            if (processedToolCallIndices.has(toolCallIdx)) return;
            const step = toToolCallStep(block, blocks, isGenerating, isLastMessage);
            if (step) allSteps.push(step);
        });
    } else {
        const toolCalls = blocks.filter(isToolCallBlock);
        const anyToolCallInProgress = toolCalls.some(
            (block) => toToolCallStep(block, blocks, isGenerating, isLastMessage)?.isActive
        );

        if (reasoning && reasoning.trim()) {
            allSteps.push({
                type: 'reasoning',
                content: reasoning,
                isActive: isGenerating && isLastMessage && !anyToolCallInProgress,
            });
        }

        for (const block of blocks) {
            if (block.type === 'tool_call') {
                const step = toToolCallStep(block, blocks, isGenerating, isLastMessage);
                if (step) allSteps.push(step);
            }
        }
    }

    if (allSteps.length > 0) {
        result.push({ type: 'steps', steps: allSteps });
    }

    const imageTextBlocks = textBlocks.filter(isImageAttachmentTextBlock);
    const proseTextBlocks = textBlocks.filter((block) => !isImageAttachmentTextBlock(block));

    for (const block of [...imageTextBlocks, ...proseTextBlocks]) {
        result.push({ type: 'text', block });
    }

    return result;
}

type RichCardStep = Extract<ThinkingStep, { type: 'tool_call' }>;

/**
 * Extract completed rich-card-eligible tool call steps from a steps group.
 */
function getRichCardSteps(steps: ThinkingStep[]): RichCardStep[] {
    return steps.filter(
        (step): step is RichCardStep =>
            step.type === 'tool_call' &&
            !step.isActive &&
            !!step.result &&
            (step.toolCall.name === 'stock' ||
                step.toolCall.name === 'cryptocurrency' ||
                step.toolCall.name === 'weather')
    );
}

export const RenderBlocks = ({
    blocks,
    message,
    isGenerating,
    isLastMessage,
    handleLinkClick,
    sourcesContainerRef,
    messageContentContainerRef,
    reasoning,
}: RenderBlocksProps) => {
    const timeline = message.thinkingTimeline;
    const interleavedItems = buildInterleavedItems(
        blocks,
        timeline,
        reasoning,
        isGenerating,
        isLastMessage,
        message.createdAt
    );
    const textBlocks = interleavedItems.filter((i) => i.type === 'text');

    // Gather all rich-card-eligible steps globally so finance comparison always works
    // regardless of whether the tool calls ended up in the same or different step groups.
    const allStepItems = interleavedItems.filter(
        (i): i is Extract<InterleavedItem, { type: 'steps' }> => i.type === 'steps'
    );
    const allRichCardSteps = allStepItems.flatMap((item) => getRichCardSteps(item.steps));

    const seenSymbols = new Set<string>();
    const globalFinanceItems: FinanceComparisonItem[] = allRichCardSteps
        .filter((s) => s.toolCall.name === 'stock' || s.toolCall.name === 'cryptocurrency')
        .flatMap((s) => {
            const data = parseFinanceResult(s.result!);
            const symbol =
                'arguments' in s.toolCall && 'symbol' in s.toolCall.arguments
                    ? (s.toolCall.arguments as { symbol: string }).symbol
                    : s.toolCall.name;
            if (!data || seenSymbols.has(symbol)) return [];
            seenSymbols.add(symbol);
            return [{ data, symbol }];
        });

    // Find the last step group index that contains any finance items, so we can
    // attach the (possibly global) comparison card to it.
    const lastFinanceGroupIdx = (() => {
        let last = -1;
        interleavedItems.forEach((item, idx) => {
            if (item.type === 'steps') {
                const hasFinance = getRichCardSteps(item.steps).some(
                    (s) => s.toolCall.name === 'stock' || s.toolCall.name === 'cryptocurrency'
                );
                if (hasFinance) last = idx;
            }
        });
        return last;
    })();
    const hasGlobalFinanceCards = lastFinanceGroupIdx !== -1 && globalFinanceItems.length > 0;
    const financeRenderKey = `${message.id}:${globalFinanceItems
        .map((item) => `${item.symbol}:${item.data.current_price}:${item.data.monthly_trend[0]?.date ?? ''}`)
        .join('|')}`;
    const [readyFinanceRenderKey, setReadyFinanceRenderKey] = useState<string | null>(null);
    const isWaitingForFinanceRender =
        isGenerating && isLastMessage && hasGlobalFinanceCards && readyFinanceRenderKey !== financeRenderKey;
    const handleFinanceReady = useCallback(() => {
        setReadyFinanceRenderKey(financeRenderKey);
    }, [financeRenderKey]);

    // Weather cards are per-group (no global comparison needed).
    const weatherCardsByIdx = new Map<number, ReturnType<typeof parseWeatherResult>[]>();
    interleavedItems.forEach((item, idx) => {
        if (item.type === 'steps') {
            const weatherSteps = getRichCardSteps(item.steps).filter((s) => s.toolCall.name === 'weather');
            const cards = weatherSteps.flatMap((s) => {
                const data = parseWeatherResult(s.result!);
                return data ? [data] : [];
            });
            if (cards.length > 0) weatherCardsByIdx.set(idx, cards);
        }
    });

    // Suppress response content while the model is still in an active thinking step.
    // Any text blocks that follow an active step group are hidden until thinking completes.
    let pastActiveSteps = false;
    let pastUnreadyFinanceCard = false;

    return (
        <>
            {interleavedItems.map((item, idx) => {
                if (item.type === 'steps') {
                    const hasActiveSteps = item.steps.some(isActiveThinkingStep);
                    if (hasActiveSteps) pastActiveSteps = true;

                    const isLastFinanceGroup = idx === lastFinanceGroupIdx;
                    const weatherCards = weatherCardsByIdx.get(idx) ?? [];
                    const hasWeather = weatherCards.length > 0;
                    const hasFinanceCards = isLastFinanceGroup && globalFinanceItems.length > 0;
                    const hasCards = hasFinanceCards || hasWeather;
                    if (hasFinanceCards && isWaitingForFinanceRender) pastUnreadyFinanceCard = true;

                    return (
                        <div key={idx}>
                            <ThinkingPath steps={item.steps} message={message} handleLinkClick={handleLinkClick} />
                            {hasCards && (
                                <>
                                    {hasFinanceCards && (
                                        <Suspense fallback={null}>
                                            {globalFinanceItems.length >= 2 ? (
                                                <FinanceComparisonResult
                                                    items={globalFinanceItems}
                                                    onReady={handleFinanceReady}
                                                />
                                            ) : (
                                                globalFinanceItems.map((finance, i) => (
                                                    <FinanceToolResult
                                                        key={i}
                                                        data={finance.data}
                                                        onReady={handleFinanceReady}
                                                    />
                                                ))
                                            )}
                                        </Suspense>
                                    )}
                                    {weatherCards.map((data, i) => (
                                        <WeatherToolResult key={i} data={data!} />
                                    ))}
                                </>
                            )}
                        </div>
                    );
                }

                // Hold back response content until all preceding thinking steps have completed
                if (pastActiveSteps || pastUnreadyFinanceCard) return null;

                const isLastTextBlock = item === textBlocks[textBlocks.length - 1];
                return (
                    <StreamingMarkdownRenderer
                        key={idx}
                        message={message}
                        content={preprocessContent(item.block.content)}
                        isStreaming={isGenerating && isLastMessage && isLastTextBlock}
                        handleLinkClick={handleLinkClick}
                        toolCallResults={null}
                        sourcesContainerRef={sourcesContainerRef}
                        messageContentContainerRef={messageContentContainerRef}
                    />
                );
            })}
        </>
    );
};
