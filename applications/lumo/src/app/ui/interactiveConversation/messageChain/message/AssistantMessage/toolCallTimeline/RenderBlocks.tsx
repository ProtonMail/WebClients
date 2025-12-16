import type { ToolCallData } from '../../../../../../lib/toolCall/types';
import type { ContentBlock, Message, ToolCallBlock } from '../../../../../../types';
import { isToolCallBlock, isToolResultBlock } from '../../../../../../types';
import StreamingMarkdownRenderer from '../../../../../components/LumoMarkdown/StreamingMarkdownRenderer';
import { parseToolCallBlock } from '../../toolCall/toolCallUtils';
import { ToolCallTimeline } from './ToolCallTimeline';

interface RenderBlocksProps {
    blocks: ContentBlock[];
    message: Message;
    isGenerating: boolean;
    isLastMessage: boolean;
    handleLinkClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
    sourcesContainerRef: React.MutableRefObject<HTMLDivElement | null>;
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
        const TurndownService = require('turndown');
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
): { toolCall: ToolCallData; isInProgress: boolean } | null {
    const toolCall = parseToolCallBlock(block);
    if (!toolCall) return null;

    const isInProgress = isToolCallInProgress(block, groupBlocks, isGenerating, isLastMessage);
    return { toolCall, isInProgress };
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
}: RenderBlocksProps) => {
    const groups = groupBlocks(blocks);

    return (
        <>
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

                // Timeline group - convert tool call blocks to timeline items
                const toolCalls = group.blocks
                    .filter(isToolCallBlock)
                    .map((block) => toTimelineItem(block, group.blocks, isGenerating, isLastMessage))
                    .filter((item): item is { toolCall: ToolCallData; isInProgress: boolean } => item !== null);

                return <ToolCallTimeline key={idx} toolCalls={toolCalls} />;
            })}
        </>
    );
};
