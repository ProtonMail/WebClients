import type { SearchItem, ThinkingTimelineEvent, ToolCallBlock } from '../../../../../../types';
import type { ContentBlock, Message } from '../../../../../../types';
import { isToolCallBlock, isToolResultBlock } from '../../../../../../types';
import StreamingMarkdownRenderer from '../../../../../LumoMarkdown/StreamingMarkdownRenderer';
import { parseToolCallBlock } from '../../toolCall/toolCallUtils';
import { FinanceComparisonResult, type FinanceComparisonItem } from './FinanceComparisonResult';
import { FinanceToolResult, parseFinanceResult } from './FinanceToolResult';
import { ThinkingPath, type ThinkingStep } from './ThinkingPath';
import { WeatherToolResult, parseWeatherResult } from './WeatherToolResult';

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
    toolCallResults?: SearchItem[] | null;
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

type InterleavedItem =
    | { type: 'steps'; steps: ThinkingStep[] }
    | { type: 'text'; block: ContentBlock };

/**
 * Build an interleaved sequence of [steps, text, steps, text, ...] items.
 *
 * Uses thinkingTimeline (if available) to place reasoning segments in-line with
 * tool calls, then flushes accumulated steps before each text block.
 * Falls back to a simpler structure when no timeline is present.
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
    const result: InterleavedItem[] = [];

    // Parse message creation time once as a fallback end-time for the last reasoning segment.
    const messageCreatedAtMs = messageCreatedAt ? new Date(messageCreatedAt).getTime() : undefined;

    if (timeline && timeline.length > 0) {
        let timelinePos = 0;
        let pendingSteps: ThinkingStep[] = [];
        // Track which toolCallIndex values have already been turned into a step so
        // duplicate timeline entries (e.g. retried or split events) don't produce
        // duplicate rows in the UI.
        const processedToolCallIndices = new Set<number>();

        // If text content has already started streaming, reasoning is done regardless
        // of whether the overall generation is still in progress.
        const hasAnyTextContent = blocks.some((b) => b.type === 'text' && b.content.trim().length > 0);

        const makeReasoningStep = (pos: number): ThinkingStep => {
            const event = timeline[pos] as { type: 'reasoning'; content: string; timestamp: number };
            const isLast = pos === timeline.length - 1;
            const isActive = isGenerating && isLastMessage && isLast && !hasAnyTextContent;
            const nextEvent = timeline[pos + 1];
            let durationMs: number | undefined;
            if (!isActive) {
                if (nextEvent !== undefined) {
                    durationMs = nextEvent.timestamp - event.timestamp;
                } else if (messageCreatedAtMs !== undefined && messageCreatedAtMs > event.timestamp) {
                    // Last reasoning segment: use message creation time as approximate end
                    durationMs = messageCreatedAtMs - event.timestamp;
                }
            }
            return { type: 'reasoning', content: event.content, isActive, durationMs };
        };

        // Consume timeline events up to and including the given tool call index.
        const consumeTimelineThrough = (maxToolCallIdx: number) => {
            while (timelinePos < timeline.length) {
                const event = timeline[timelinePos];
                if (event.type === 'tool_call' && event.toolCallIndex > maxToolCallIdx) break;

                if (event.type === 'reasoning') {
                    pendingSteps.push(makeReasoningStep(timelinePos));
                } else if (event.type === 'tool_call') {
                    if (!processedToolCallIndices.has(event.toolCallIndex)) {
                        processedToolCallIndices.add(event.toolCallIndex);
                        const block = toolCallBlocks[event.toolCallIndex];
                        if (block) {
                            const step = toToolCallStep(block, blocks, isGenerating, isLastMessage);
                            if (step) pendingSteps.push(step);
                        }
                    }
                }
                timelinePos++;
            }
        };

        // Consume reasoning events (and any tool_call events that have no corresponding block,
        // i.e. phantom events) until we hit a real tool_call that still needs processing.
        const consumeTrailingReasoning = () => {
            while (timelinePos < timeline.length) {
                const event = timeline[timelinePos];
                if (event.type === 'reasoning') {
                    pendingSteps.push(makeReasoningStep(timelinePos));
                    timelinePos++;
                } else if (event.type === 'tool_call') {
                    // If this tool call has no corresponding block it's a phantom — skip it.
                    // Otherwise stop so the block-loop can process it properly.
                    if (event.toolCallIndex >= toolCallBlocks.length) {
                        timelinePos++;
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            }
        };

        for (const block of blocks) {
            if (block.type === 'tool_call') {
                const toolCallIdx = toolCallBlocks.indexOf(block);
                consumeTimelineThrough(toolCallIdx);
            } else if (block.type === 'tool_result') {
                // Handled implicitly via tool_call processing above
            } else if (block.type === 'text') {
                // Skip empty text blocks — they would otherwise split step groups
                // (e.g. break a two-stock comparison into two separate groups).
                if (!block.content.trim()) continue;

                // Pull in any reasoning that happened after the last tool call but before this text
                consumeTrailingReasoning();

                if (pendingSteps.length > 0) {
                    result.push({ type: 'steps', steps: [...pendingSteps] });
                    pendingSteps = [];
                }
                result.push({ type: 'text', block });
            }
        }

        // Consume any remaining timeline events (e.g. active reasoning with no text yet)
        while (timelinePos < timeline.length) {
            const event = timeline[timelinePos];

            if (event.type === 'reasoning') {
                pendingSteps.push(makeReasoningStep(timelinePos));
            } else if (event.type === 'tool_call' && !processedToolCallIndices.has(event.toolCallIndex)) {
                processedToolCallIndices.add(event.toolCallIndex);
                const block = toolCallBlocks[event.toolCallIndex];
                if (block) {
                    const step = toToolCallStep(block, blocks, isGenerating, isLastMessage);
                    if (step) pendingSteps.push(step);
                }
            }
            timelinePos++;
        }

        if (pendingSteps.length > 0) {
            // If there are text blocks already in result, move these trailing steps
            // to just before the last text block so reasoning always precedes content.
            const lastTextIdx = result.map((r) => r.type).lastIndexOf('text');
            if (lastTextIdx !== -1) {
                const prevItem = result[lastTextIdx - 1];
                if (prevItem?.type === 'steps') {
                    // Merge into the existing step group before the last text block
                    prevItem.steps.push(...pendingSteps);
                } else {
                    result.splice(lastTextIdx, 0, { type: 'steps', steps: pendingSteps });
                }
            } else {
                result.push({ type: 'steps', steps: pendingSteps });
            }
        }
    } else {
        // Fallback: no timeline — put reasoning first, then interleave tool calls with text
        const pendingSteps: ThinkingStep[] = [];
        const toolCalls = blocks.filter(isToolCallBlock);
        const anyToolCallInProgress = toolCalls.some((b) =>
            toToolCallStep(b, blocks, isGenerating, isLastMessage)?.isActive
        );

        if (reasoning && reasoning.trim()) {
            pendingSteps.push({
                type: 'reasoning',
                content: reasoning,
                isActive: isGenerating && isLastMessage && !anyToolCallInProgress,
            });
        }

        for (const block of blocks) {
            if (block.type === 'tool_call') {
                const step = toToolCallStep(block, blocks, isGenerating, isLastMessage);
                if (step) pendingSteps.push(step);
            } else if (block.type === 'tool_result') {
                // skip
            } else if (block.type === 'text') {
                if (pendingSteps.length > 0) {
                    result.push({ type: 'steps', steps: [...pendingSteps] });
                    pendingSteps.splice(0);
                }
                result.push({ type: 'text', block });
            }
        }

        if (pendingSteps.length > 0) {
            result.push({ type: 'steps', steps: pendingSteps });
        }
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
    const allStepItems = interleavedItems.filter((i): i is Extract<InterleavedItem, { type: 'steps' }> => i.type === 'steps');
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

    // Suppress text content while the model is still in an active reasoning step.
    // A step group is "blocking" if it contains at least one isActive reasoning step.
    // Any text blocks that follow a blocking step group are hidden until thinking completes.
    let pastActiveReasoning = false;

    return (
        <>
            {interleavedItems.map((item, idx) => {
                if (item.type === 'steps') {
                    const hasActiveReasoning = item.steps.some(
                        (s) => s.type === 'reasoning' && s.isActive
                    );
                    if (hasActiveReasoning) pastActiveReasoning = true;

                    const isLastFinanceGroup = idx === lastFinanceGroupIdx;
                    const weatherCards = weatherCardsByIdx.get(idx) ?? [];
                    const hasWeather = weatherCards.length > 0;
                    const hasFinanceCards = isLastFinanceGroup && globalFinanceItems.length > 0;
                    const hasCards = hasFinanceCards || hasWeather;

                    // When cards are present, split the steps at the boundary between the last
                    // tool call and any subsequent reasoning so the card appears right after the
                    // tool calls that produced it, with post-tool reasoning below the card.
                    let preCardSteps = item.steps;
                    let postCardSteps: ThinkingStep[] = [];

                    if (hasCards) {
                        const lastToolCallIdx = item.steps.reduce(
                            (last, s, i) => (s.type === 'tool_call' ? i : last),
                            -1
                        );
                        if (lastToolCallIdx !== -1 && lastToolCallIdx < item.steps.length - 1) {
                            preCardSteps = item.steps.slice(0, lastToolCallIdx + 1);
                            postCardSteps = item.steps.slice(lastToolCallIdx + 1);
                        }
                    }

                    return (
                        <div key={idx}>
                            <ThinkingPath
                                steps={preCardSteps}
                                message={message}
                                handleLinkClick={handleLinkClick}
                            />
                            {hasCards && (
                                <>
                                    {hasFinanceCards && (
                                        globalFinanceItems.length >= 2 ? (
                                            <FinanceComparisonResult items={globalFinanceItems} />
                                        ) : (
                                            globalFinanceItems.map((finance, i) => (
                                                <FinanceToolResult key={i} data={finance.data} />
                                            ))
                                        )
                                    )}
                                    {weatherCards.map((data, i) => (
                                        <WeatherToolResult key={i} data={data!} />
                                    ))}
                                </>
                            )}
                            {postCardSteps.length > 0 && (
                                <ThinkingPath
                                    steps={postCardSteps}
                                    message={message}
                                    handleLinkClick={handleLinkClick}
                                />
                            )}
                        </div>
                    );
                }

                // Hold back text content until all preceding active reasoning has completed
                if (pastActiveReasoning) return null;

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
                    />
                );
            })}
        </>
    );
};
