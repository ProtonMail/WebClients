import { clsx } from 'clsx';

import type { ContentBlock, Message } from '../../../../../types';
import StreamingMarkdownRenderer from '../../../../components/LumoMarkdown/StreamingMarkdownRenderer';
import {
    isToolResultErrorBlock,
    parseToolCallBlock,
} from '../toolCall/toolCallUtils';

interface BlockRendererProps {
    block: ContentBlock;
    blockIndex: number;
    message: Message;
    isStreaming: boolean;
    isLastBlock: boolean;
    handleLinkClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
    sourcesContainerRef: React.MutableRefObject<HTMLDivElement | null>;
}

function preprocessContent(content: string | undefined): string {
    if (!content) return '';
    content = content.trim();
    // Sometimes the model replies in raw html
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

export const BlockRenderer = ({
    block,
    blockIndex,
    message,
    isStreaming,
    isLastBlock,
    handleLinkClick,
    sourcesContainerRef,
}: BlockRendererProps) => {
    if (block.type === 'text') {
        return (
            <StreamingMarkdownRenderer
                key={blockIndex}
                message={message}
                content={preprocessContent(block.content)}
                isStreaming={isStreaming && isLastBlock}
                handleLinkClick={handleLinkClick}
                toolCallResults={null}
                sourcesContainerRef={sourcesContainerRef}
            />
        );
    }

    if (block.type === 'tool_call') {
        const toolCall = parseToolCallBlock(block);
        return (
            <div key={blockIndex} className="tool-call-block p-2 rounded bg-weak border border-weak">
                <p className="text-sm color-weak m-0">Tool: {toolCall?.name || 'unknown'}</p>
            </div>
        );
    }

    if (block.type === 'tool_result') {
        const hasError = isToolResultErrorBlock(block);
        return (
            <div
                key={blockIndex}
                className={clsx(
                    'tool-result-block p-2 rounded border',
                    hasError ? 'bg-danger-weak border-danger' : 'bg-success-weak border-success'
                )}
            >
                <p className="text-sm m-0">{hasError ? 'Tool execution failed' : 'Tool executed'}</p>
            </div>
        );
    }

    return null;
};
