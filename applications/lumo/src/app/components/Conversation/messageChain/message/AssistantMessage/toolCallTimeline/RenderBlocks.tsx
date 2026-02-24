import type { ToolCallData } from '../../../../../../lib/toolCall/types';
import type { ContentBlock, Message, ToolCallBlock } from '../../../../../../types';
import { isToolCallBlock, isToolResultBlock } from '../../../../../../types';
import StreamingMarkdownRenderer from '../../../../../LumoMarkdown/StreamingMarkdownRenderer';
import { parseToolCallBlock } from '../../toolCall/toolCallUtils';
import { ThinkingPath, type ThinkingStep } from './ThinkingPath';

// eslint-disable-next-line @typescript-eslint/no-var-requires
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
    groupBlocks: ContentBlock[],
    isGenerating: boolean,
    isLastMessage: boolean
): boolean {
    if (!isGenerating || !isLastMessage) return false;

    const blockIndex = groupBlocks.indexOf(block);
    const isLastInGroup = block === groupBlocks[groupBlocks.length - 1];

    // Check if there's a result after this tool call
    const hasResult = groupBlocks.some((b, idx) => idx > blockIndex && isToolResultBlock(b));

    return isLastInGroup && !hasResult;
}

/**
 * Convert a tool call block to timeline item data.
 */
function toTimelineItem(
    block: ToolCallBlock,
    groupBlocks: ContentBlock[],
    isGenerating: boolean,
    isLastMessage: boolean
): { toolCall: ToolCallData; result?: string; isInProgress: boolean } | null {
    const toolCall = parseToolCallBlock(block);
    if (!toolCall) return null;

    const isInProgress = isToolCallInProgress(block, groupBlocks, isGenerating, isLastMessage);
    
    // Find the corresponding tool result
    const blockIndex = groupBlocks.indexOf(block);
    const resultBlock = groupBlocks.find((b, idx) => idx > blockIndex && isToolResultBlock(b));
    const result = resultBlock?.type === 'tool_result' ? resultBlock.content : undefined;
    
    return { toolCall, result, isInProgress };
}

type SingleTextBlock = { type: 'text'; block: ContentBlock };
type TimelineBlockGroup = { type: 'timeline'; blocks: ContentBlock[] };
type BlockGroupingResultItem = SingleTextBlock | TimelineBlockGroup;

/**
 * Group consecutive tool call/result blocks together, with text blocks breaking the groups.
 * Returns an array of render groups.
 *
 * @example
 * Input:  [text, tool_call, tool_result, text, tool_call, tool_result, tool_call]
 * Output: [
 *   { type: 'text', block: text },
 *   { type: 'timeline', blocks: [tool_call, tool_result] },
 *   { type: 'text', block: text },
 *   { type: 'timeline', blocks: [tool_call, tool_result, tool_call] }
 * ]
 */
function groupBlocks(blocks: ContentBlock[]): BlockGroupingResultItem[] {
    const groups: BlockGroupingResultItem[] = [];
    let currentToolGroup: ContentBlock[] = [];

    for (const block of blocks) {
        if (block.type === 'text') {
            // Text block breaks the tool call group
            if (currentToolGroup.length > 0) {
                groups.push({ type: 'timeline', blocks: currentToolGroup });
                currentToolGroup = [];
            }
            groups.push({ type: 'text', block });
        } else {
            // Tool call or tool result - add to current group
            currentToolGroup.push(block);
        }
    }

    // Don't forget the last group
    if (currentToolGroup.length > 0) {
        groups.push({ type: 'timeline', blocks: currentToolGroup });
    }

    return groups;
}

export const RenderBlocks = ({
    blocks,
    message,
    isGenerating,
    isLastMessage,
    handleLinkClick,
    sourcesContainerRef,
    reasoning,
}: RenderBlocksProps) => {
    const groups = groupBlocks(blocks);

    // Check if we need to show the thinking path (reasoning + tool calls)
    const hasReasoning = reasoning && reasoning.trim().length > 0;
    const hasToolCalls = blocks.some((block) => isToolCallBlock(block));
    const showThinkingPath = hasReasoning || hasToolCalls;

    // Build thinking path steps based on the thinking timeline if available
    const thinkingSteps: ThinkingStep[] = [];
    const timeline = message.thinkingTimeline;
    
    if (timeline && timeline.length > 0) {
        const toolCalls = blocks.filter(isToolCallBlock);
        
        console.log('[THINKING PATH DEBUG]', {
            timelineLength: timeline.length,
            timeline: timeline.map((e, idx) => ({
                index: idx,
                type: e.type,
                ...(e.type === 'tool_call' && { toolCallIndex: e.toolCallIndex }),
            })),
            totalToolCallBlocks: toolCalls.length,
        });
        
        for (let i = 0; i < timeline.length; i++) {
            const event = timeline[i];
            
            if (event.type === 'reasoning') {
                const isLastReasoningSegment = i === timeline.length - 1 || 
                    !timeline.slice(i + 1).some(e => e.type === 'reasoning');
                const toolCallsInProgress = toolCalls.some((block) => 
                    toTimelineItem(block, blocks, isGenerating, isLastMessage)?.isInProgress
                );
                
                thinkingSteps.push({
                    type: 'reasoning',
                    content: event.content,
                    isActive: isGenerating && isLastMessage && isLastReasoningSegment && !toolCallsInProgress,
                });
            } else if (event.type === 'tool_call') {
                const toolCallBlock = toolCalls[event.toolCallIndex];
                if (toolCallBlock) {
                    const item = toTimelineItem(toolCallBlock, blocks, isGenerating, isLastMessage);
                    if (item) {
                        thinkingSteps.push({
                            type: 'tool_call',
                            toolCall: item.toolCall,
                            result: item.result,
                            isActive: item.isInProgress,
                        });
                    }
                }
            }
        }
    } else if (hasReasoning || hasToolCalls) {
        if (hasReasoning) {
            const toolCallsInProgress = blocks.filter(isToolCallBlock).some((block) => 
                toTimelineItem(block, blocks, isGenerating, isLastMessage)?.isInProgress
            );
            
            thinkingSteps.push({
                type: 'reasoning',
                content: reasoning,
                isActive: isGenerating && isLastMessage && !toolCallsInProgress,
            });
        }

        if (hasToolCalls) {
            blocks.filter(isToolCallBlock).forEach((block) => {
                const item = toTimelineItem(block, blocks, isGenerating, isLastMessage);
                if (item) {
                    thinkingSteps.push({
                        type: 'tool_call',
                        toolCall: item.toolCall,
                        result: item.result,
                        isActive: item.isInProgress,
                    });
                }
            });
        }
    }

    return (
        <>
            {/* Show unified thinking path if we have reasoning or tool calls */}
            {showThinkingPath && (
                <ThinkingPath steps={thinkingSteps} message={message} handleLinkClick={handleLinkClick} />
            )}

            {/* Render text content blocks */}
            {groups.map((group, idx) => {
                if (group.type === 'text') {
                    const isLastGroup = idx === groups.length - 1;
                    return (
                        <StreamingMarkdownRenderer
                            key={idx}
                            message={message}
                            content={preprocessContent(group.block.content)}
                            isStreaming={isGenerating && isLastMessage && isLastGroup}
                            handleLinkClick={handleLinkClick}
                            toolCallResults={null}
                            sourcesContainerRef={sourcesContainerRef}
                        />
                    );
                }

                // Skip timeline groups - they're now handled by ThinkingPath
                return null;
            })}
        </>
    );
};
