import React, { useMemo } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { SyntaxHighlighter } from './syntaxHighlighterConfig';
import { ThemeTypes } from '@proton/shared/lib/themes/constants';
import type { SearchItem } from '../../../lib/toolCall/types';
import { useLumoTheme } from '../../../providers/LumoThemeProvider';
import { convertRefTokensToSpans } from '../../../util/tokens';
import { parseInteger } from '../../../util/number';
import { getDomain } from '../../interactiveConversation/messageChain/message/toolCall/helpers';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';

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
        hash = ((hash << 5) - hash) + char;
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
    onCopy?: () => void;
    handleLinkClick?: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
    toolCallResults?: SearchItem[] | null;
    sourcesContainerRef?: React.RefObject<HTMLDivElement>;
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
}> = React.memo(({ content, theme, handleLinkClick, toolCallResults, sourcesContainerRef }) => {
    
    // RefLink component for source references
    const RefLink = useMemo(
        () =>
            React.memo(
                ({ id, children }: { id: string; children: React.ReactNode }) => {
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
                }
            ),
        [toolCallResults, sourcesContainerRef, handleLinkClick]
    );
    
    const CodeBlock = useMemo(() => {
        return ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const value = String(children).replace(/\n$/, '');

            if (!inline && language) {
                return (
                    <div style={{ position: 'relative' }}>
                        <SyntaxHighlighter
                            language={language}
                            style={theme === ThemeTypes.LumoDark ? oneDark : oneLight}
                            wrapLongLines={true}
                            PreTag="div"
                        >
                            {value}
                        </SyntaxHighlighter>
                    </div>
                );
            }

            return (
                <code className={className} {...props}>
                    {children}
                </code>
            );
        };
    }, [theme]);

    // OPTIMIZATION: CSS containment for better rendering performance
    // Browser can skip rendering this block if off-screen
    const containerStyle: React.CSSProperties = {
        contentVisibility: 'auto' as any,
        contain: 'layout style paint',
    };

    // Always include remarkGfm for table support (even during streaming)
    // Users need to see partial tables rendered as they stream, not just raw text
    const plugins = [remarkGfm];
    
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
        }),
        [CodeBlock, RefLink, handleLinkClick]
    );
    
    return (
        <div style={containerStyle}>
            <Markdown
                remarkPlugins={plugins}
                components={components}
            >
                {content}
            </Markdown>
        </div>
    );
}, (prev, next) => {
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
});

MarkdownBlock.displayName = 'MarkdownBlock';

export const ProgressiveMarkdownRenderer: React.FC<ProgressiveMarkdownProps> = React.memo(
    ({ content, isStreaming, onCopy, handleLinkClick, toolCallResults, sourcesContainerRef }) => {
        const themeContext = useLumoTheme();
        const theme = themeContext as unknown as ThemeTypes;
        
        // Process REF tokens and convert to markdown links
        const processedContent = useMemo(() => {
            return convertRefTokensToSpans(content || '');
        }, [content]);
        
        // Split content into complete (cacheable) and incomplete (active) blocks
        // Note: Parent component (StreamingMarkdownRenderer) already handles throttling,
        // so we don't need additional debouncing here to avoid double-rendering issues
        const blocks = useMemo(() => {
            return splitIntoBlocks(processedContent, isStreaming);
        }, [processedContent, isStreaming]);
        
        return (
            <div className="progressive-markdown-content">
                {blocks.map((block) => (
                    <div 
                        key={block.key}
                        style={{
                            contentVisibility: 'auto',
                            containIntrinsicSize: 'auto 100px',
                            overflowX: 'auto' // For tables.
                        }}
                    >
                        <MarkdownBlock
                            content={block.content}
                            theme={theme}
                            handleLinkClick={handleLinkClick}
                            toolCallResults={toolCallResults}
                            sourcesContainerRef={sourcesContainerRef}
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

