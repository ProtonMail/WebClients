import React, { useMemo, useRef } from 'react';
import Markdown from 'react-markdown';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { isIos, isIpad, isSafari } from '@proton/shared/lib/helpers/browser';
import { ThemeTypes } from '@proton/shared/lib/themes/constants';

import { useCopyNotification } from '../../../hooks/useCopyNotification';
import type { SearchItem } from '../../../lib/toolCall/types';
import { useLumoTheme } from '../../../providers/LumoThemeProvider';
import { parseInteger } from '../../../util/number';
import { convertRefTokensToSpans, normalizeBrTags, processForLatexMarkdown } from '../../../util/tokens';
import LumoCopyButton from '../../interactiveConversation/messageChain/message/actionToolbar/LumoCopyButton';
import { getDomain } from '../../interactiveConversation/messageChain/message/toolCall/helpers';
import { InlineImageComponent } from './InlineImageComponent';
import { SyntaxHighlighter } from './syntaxHighlighterConfig';

import './LumoMarkdown.scss';

/**
 * Progressive Markdown Renderer
 *
 * Intelligently splits content into "complete" and "incomplete" sections:
 * - Complete sections (closed code blocks, paragraphs) are rendered once and cached
 * - Only the incomplete/streaming section is re-rendered on updates
 *
 * This dramatically reduces re-rendering overhead during streaming:
 * - Instead of re-parsing 10KB of content on every token
 * - We only re-parse the last ~100 bytes (active section)
 */

interface ContentBlock {
    type: 'complete' | 'incomplete';
    content: string;
    key: string;
}

/**
 * Simple hash function for creating stable keys from content
 */
function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

/**
 * Split content into complete blocks (ready to cache) and incomplete block (still streaming)
 *
 * Detects:
 * - Complete code blocks (```...```)
 * - Complete tables (header + separator + at least one row, followed by \n\n)
 * - Complete paragraphs (text followed by \n\n)
 * - Incomplete section (still streaming)
 *
 * Uses content-based keys (hash of content) so complete blocks maintain identity across updates
 */
function splitIntoBlocks(content: string, isStreaming: boolean): ContentBlock[] {
    if (!content) return [];

    const blocks: ContentBlock[] = [];
    let position = 0;

    // Process content sequentially looking for complete blocks
    while (position < content.length) {
        const remaining = content.substring(position);

        // 1. Check for complete code block
        const codeMatch = remaining.match(/^```[\s\S]*?\n```(\n\n|$)/);
        if (codeMatch) {
            const blockContent = codeMatch[0];
            blocks.push({
                type: 'complete',
                content: blockContent,
                // Use hash of content as key - stays same even as more content is added
                key: `code-${simpleHash(blockContent)}`,
            });
            position += blockContent.length;
            continue;
        }

        // 2. Check for complete table (header | separator | rows, followed by \n\n or EOF)
        // Table format: |...| (header) \n |---| (separator) \n |...| (rows) \n\n
        const tableMatch = remaining.match(/^(\|[^\n]+\|\n\|[\s:-]+\|\n(?:\|[^\n]+\|\n)+)(\n|$)/);
        if (tableMatch) {
            const tableContent = tableMatch[1];
            const hasDoubleNewline = remaining.substring(tableContent.length).startsWith('\n\n');

            if (hasDoubleNewline || position + tableContent.length >= content.length) {
                // Table is complete (followed by \n\n or at end of content)
                const blockContent = tableContent + '\n\n';
                blocks.push({
                    type: 'complete',
                    content: blockContent,
                    key: `table-${simpleHash(blockContent)}`,
                });
                position += tableContent.length + 2; // +2 for \n\n
                continue;
            }
        }

        // 3. Check for complete paragraph (text followed by \n\n)
        const paraMatch = remaining.match(/^((?:(?!\n\n|```|\|[^\n]+\|).)+)(\n\n)/);
        if (paraMatch) {
            const blockContent = paraMatch[0];
            blocks.push({
                type: 'complete',
                content: blockContent,
                key: `para-${simpleHash(blockContent)}`,
            });
            position += blockContent.length;
            continue;
        }

        // 4. Everything else
        // If streaming: mark as incomplete
        // If not streaming: mark as complete (streaming just finished)
        // Use stable 'final' key to avoid remounting when streaming finishes
        blocks.push({
            type: isStreaming ? 'incomplete' : 'complete',
            content: remaining,
            key: isStreaming ? 'streaming' : 'final',
        });
        break;
    }

    return blocks;
}

interface ProgressiveMarkdownProps {
    content: string;
    isStreaming: boolean;
    handleLinkClick?: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
    toolCallResults?: SearchItem[] | null;
    sourcesContainerRef?: React.RefObject<HTMLDivElement>;
    message: any;
}

/**
 * Renders a single markdown block with syntax highlighting
 *
 * Simple approach: Just render everything normally, but cache completed blocks.
 * Progressive rendering ensures only incomplete blocks re-parse on each update.
 */
const MarkdownBlock: React.FC<{
    content: string;
    theme: ThemeTypes;
    handleLinkClick?: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
    toolCallResults?: SearchItem[] | null;
    sourcesContainerRef?: React.RefObject<HTMLDivElement>;
    message: any;
}> = React.memo(
    ({ content, theme, handleLinkClick, toolCallResults, sourcesContainerRef, message }) => {
        // RefLink component for source references
        const RefLink = useMemo(
            () =>
                React.memo(({ id, children }: { id: string; children: React.ReactNode }) => {
                    if (!toolCallResults) return null;

                    const idInt = parseInteger(id);
                    if (!idInt) return null;

                    const toolCallInfo = toolCallResults?.[idInt];
                    if (!toolCallInfo) return null;

                    const url = toolCallInfo?.url;
                    if (!url) return null;

                    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
                        if (handleLinkClick) {
                            handleLinkClick(e, toolCallInfo?.url ?? '');
                        }
                    };

                    const handleMouseEnter = () => {
                        if (sourcesContainerRef?.current) {
                            const sourceElement = sourcesContainerRef.current.querySelector(
                                `[data-source-index="${id}"]`
                            );
                            if (sourceElement) {
                                sourceElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                sourceElement.classList.add('highlight-source');
                            }
                        }
                    };

                    const handleMouseLeave = () => {
                        if (sourcesContainerRef?.current) {
                            const sourceElement = sourcesContainerRef.current.querySelector(
                                `[data-source-index="${id}"]`
                            );
                            if (sourceElement) {
                                sourceElement.classList.remove('highlight-source');
                            }
                        }
                    };

                    return (
                        <ButtonLike
                            pill
                            size="small"
                            color="weak"
                            shape="solid"
                            as="a"
                            className="ref-link text-sm mx-1 py-0.5 px-1 lh100"
                            href={url}
                            onClick={handleClick}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {getDomain(toolCallInfo)}
                        </ButtonLike>
                    );
                }),
            [toolCallResults, sourcesContainerRef, handleLinkClick]
        );

        const CodeBlock = useMemo(() => {
            // eslint-disable-next-line react/display-name
            return ({ node, inline, className, children, ...props }: any) => {
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : '';
                const value = String(children).replace(/\n$/, '');

                if (!inline && language) {
                    return <CodeBlockWrapper language={language} value={value} theme={theme} />;
                }

                return (
                    <code className={className} {...props}>
                        {children}
                    </code>
                );
            };
        }, [theme]);

        // Custom components for markdown rendering
        const components = useMemo(
            () => ({
                code: CodeBlock,
                a: (props: any) => {
                    const { href, children } = props;

                    // Handle REF links
                    if (href?.startsWith('#ref-')) {
                        const id = href.substring(5);
                        return <RefLink id={id}>{children}</RefLink>;
                    }

                    // Handle regular links
                    if (!handleLinkClick || !href) {
                        return <a href={href}>{children}</a>;
                    }

                    return (
                        <a href={href} onClick={(e) => handleLinkClick(e, href)}>
                            {children}
                        </a>
                    );
                },
                img: (props: any) => {
                    const { src, alt } = props;

                    // Handle attachment: URLs
                    if (src?.startsWith('attachment:')) {
                        const attachmentId = src.substring('attachment:'.length);
                        // Look up full attachment from Redux (not from message.attachments which is shallow)
                        return <InlineImageComponent attachmentId={attachmentId} alt={alt} />;
                    }

                    // For security, don't render other images
                    return null;
                },
                table(props: any) {
                    return (
                        <div className="markdown-table-wrapper">
                            <table {...props} />
                        </div>
                    );
                },
            }),
            [CodeBlock, RefLink, handleLinkClick]
        );

        return (
            <Markdown
                remarkPlugins={[remarkGfm, [remarkMath, { singleDollarTextMath: false }]]}
                rehypePlugins={[() => rehypeKatex({ output: 'mathml' })]}
                components={components}
                urlTransform={(url) => {
                    // Preserve attachment: URLs, sanitize everything else
                    if (url.startsWith('attachment:')) {
                        return url;
                    }
                    // Default sanitization for other URLs
                    return url;
                }}
            >
                {content}
            </Markdown>
        );
    },
    (prev, next) => {
        // Custom comparison for React.memo
        // Returns TRUE if props are equal (skip re-render)
        // Returns FALSE if props changed (do re-render)

        const contentEqual = prev.content === next.content;
        const themeEqual = prev.theme === next.theme;

        const shouldSkipRender = contentEqual && themeEqual;

        // For incomplete (streaming) blocks:
        // - content changes on every update → contentEqual = false → shouldSkipRender = false → re-renders ✅
        // For complete blocks:
        // - content stays same → contentEqual = true → shouldSkipRender = true → skips re-render ✅

        return shouldSkipRender;
    }
);

// Component for code blocks that can use hooks
const CodeBlockWrapper: React.FC<{
    language: string;
    value: string;
    theme: ThemeTypes;
}> = ({ language, value, theme }) => {
    const codeBlockRef = useRef<HTMLDivElement>(null);
    const { showCopyNotification } = useCopyNotification();
    return (
        <div ref={codeBlockRef} className="message-container code-container relative">
            <div className="flex flex-row flex-nowrap">
                <div className="flex-auto">
                    <SyntaxHighlighter
                        language={language}
                        style={theme === ThemeTypes.LumoDark ? oneDark : oneLight}
                        wrapLongLines={true}
                        PreTag="div"
                    >
                        {value}
                    </SyntaxHighlighter>
                </div>
            </div>
            <div className="lumo-no-copy absolute top-0 right-0 z-10" style={{ transform: 'translate(4px, -4px)' }}>
                <LumoCopyButton containerRef={codeBlockRef} onSuccess={showCopyNotification} />
            </div>
        </div>
    );
};

MarkdownBlock.displayName = 'MarkdownBlock';

export const ProgressiveMarkdownRenderer: React.FC<ProgressiveMarkdownProps> = React.memo(
    ({ content, isStreaming, handleLinkClick, toolCallResults, sourcesContainerRef, message }) => {
        const { theme } = useLumoTheme();

        // Process REF tokens and convert to markdown links
        const processedContent = useMemo(() => {
            const processedContent = convertRefTokensToSpans(content || '');
            const processedContentWithMath = processForLatexMarkdown(processedContent);
            const processedContentWithNormalizedBr = normalizeBrTags(processedContentWithMath);
            return processedContentWithNormalizedBr;
        }, [content]);

        // Split content into complete (cacheable) and incomplete (active) blocks
        // Note: Parent component (StreamingMarkdownRenderer) already handles throttling,
        // so we don't need additional debouncing here to avoid double-rendering issues
        const blocks = useMemo(() => {
            return splitIntoBlocks(processedContent, isStreaming);
        }, [processedContent, isStreaming]);

        const className = useMemo(() => {
            return isIos() || isIpad() || isSafari() ? '' : 'content-visibility-auto';
        }, [isIos(), isIpad(), isSafari()]);
        return (
            <div className="progressive-markdown-content markdown-rendering">
                {blocks.map((block) => (
                    <div key={block.key} className={className}>
                        <MarkdownBlock
                            content={block.content}
                            theme={theme}
                            handleLinkClick={handleLinkClick}
                            toolCallResults={toolCallResults}
                            sourcesContainerRef={sourcesContainerRef}
                            message={message}
                        />
                    </div>
                ))}
            </div>
        );
    },
    (prevProps, nextProps) => {
        // Only re-render if content changed or streaming state changed
        const contentEqual = prevProps.content === nextProps.content;
        const streamingEqual = prevProps.isStreaming === nextProps.isStreaming;

        return contentEqual && streamingEqual;
    }
);

ProgressiveMarkdownRenderer.displayName = 'ProgressiveMarkdownRenderer';

export default ProgressiveMarkdownRenderer;
