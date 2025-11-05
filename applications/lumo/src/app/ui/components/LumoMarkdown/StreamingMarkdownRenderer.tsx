import React, { useEffect, useMemo, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

import remarkGfm from 'remark-gfm';

import { SyntaxHighlighter } from './syntaxHighlighterConfig';
import { ProgressiveMarkdownRenderer } from './ProgressiveMarkdownRenderer';

import { ButtonLike } from '@proton/atoms';
import { Copy } from '@proton/components';
import { ThemeTypes } from '@proton/shared/lib/themes/constants';

import type { SearchItem } from '../../../lib/toolCall/types';
import { useLumoTheme } from '../../../providers/LumoThemeProvider';
import type { Message } from '../../../types';
import { parseInteger } from '../../../util/number';
import { convertRefTokensToSpans } from '../../../util/tokens';
import { getDomain } from '../../interactiveConversation/messageChain/message/toolCall/helpers';

/**
 * Optimized Streaming Markdown Renderer
 *
 * This component solves the performance problem of re-parsing markdown on every token during streaming:
 *
 * PROBLEM:
 * - Streaming responses trigger Redux updates for every token chunk (potentially 1000+ times)
 * - Each update causes the entire markdown to be re-parsed and syntax highlighted
 * - This creates exponential complexity: O(n²) where n is message length
 * - Result: UI becomes sluggish, high CPU/memory usage
 *
 * SOLUTION:
 * - Use requestAnimationFrame to throttle render updates (60fps max)
 * - Detect streaming state and defer expensive parsing during active streaming
 * - Show raw text while streaming, full markdown when complete
 * - Optional: Show a "rendering..." state for code-heavy content
 */

const STREAMING_UPDATE_INTERVAL = 50; // Update every 50ms during streaming (smoother)
const RENDER_RAW_TEXT_THRESHOLD = 8000; // Show raw text for content > 8KB during streaming

interface StreamingMarkdownProps {
    message: Message;
    content: string | undefined;
    isStreaming?: boolean;
    onCopy?: () => void;
    handleLinkClick?: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
    toolCallResults?: SearchItem[] | null;
    sourcesContainerRef?: React.RefObject<HTMLDivElement>;
}

/**
 * Throttled markdown renderer that batches updates during streaming
 */
export const StreamingMarkdownRenderer: React.FC<StreamingMarkdownProps> = React.memo(
    ({ message, content, isStreaming = false, onCopy, handleLinkClick, toolCallResults, sourcesContainerRef }) => {
        const [displayContent, setDisplayContent] = useState(content || '');
        const contentRef = useRef(content);
        const frameRef = useRef<number>();
        const lastUpdateRef = useRef<number>(0);
        
        // Lock isStreaming to its initial value to prevent re-render when streaming state changes
        // This prevents the "unmount old tree → content disappears → scroll jumps → mount new tree" issue
        const lockedIsStreamingRef = useRef<boolean | null>(null);
        if (lockedIsStreamingRef.current === null && content && content.length > 50) {
            // Lock to current state once we have meaningful content
            lockedIsStreamingRef.current = isStreaming;
        }
        const effectiveIsStreaming = lockedIsStreamingRef.current ?? isStreaming;
        
        // Update content with throttling during streaming
        useEffect(() => {
            contentRef.current = content;

            if (!effectiveIsStreaming) {
                // Not streaming - update immediately and show full markdown
                setDisplayContent(content || '');
                return;
            }

            // Streaming - throttle updates
            const now = Date.now();
            const timeSinceLastUpdate = now - lastUpdateRef.current;

            if (timeSinceLastUpdate < STREAMING_UPDATE_INTERVAL) {
                // Too soon, schedule for later
                if (frameRef.current) {
                    cancelAnimationFrame(frameRef.current);
                }

                frameRef.current = requestAnimationFrame(() => {
                    const remaining = STREAMING_UPDATE_INTERVAL - (Date.now() - lastUpdateRef.current);
                    if (remaining > 0) {
                        setTimeout(() => {
                            setDisplayContent(contentRef.current || '');
                            lastUpdateRef.current = Date.now();
                        }, remaining);
                    } else {
                        setDisplayContent(contentRef.current || '');
                        lastUpdateRef.current = Date.now();
                    }
                });
            } else {
                // Enough time has passed, update now
                setDisplayContent(content || '');
                lastUpdateRef.current = now;
            }

            return () => {
                if (frameRef.current) {
                    cancelAnimationFrame(frameRef.current);
                }
            };
        }, [content, effectiveIsStreaming]);

        // Use progressive rendering - renders complete blocks once, only re-parses incomplete section
        return (
            <ProgressiveMarkdownRenderer
                content={displayContent}
                isStreaming={effectiveIsStreaming}
                onCopy={onCopy}
                handleLinkClick={handleLinkClick}
                toolCallResults={toolCallResults}
                sourcesContainerRef={sourcesContainerRef}
            />
        );
    },
    (prevProps, nextProps) => {
        // Custom comparison to prevent unnecessary re-renders
        const contentChanged = prevProps.content !== nextProps.content;
        
        // Only re-render if content changed
        // Note: We ignore isStreaming changes because we use effectiveIsStreaming internally
        // which is locked after initial render. This prevents flickering cursor on stream end.
        if (!contentChanged) {
            return true; // Props are equal, skip re-render
        }

        // During streaming, skip re-renders only for very small changes
        if (nextProps.isStreaming && contentChanged) {
            const prevLength = prevProps.content?.length || 0;
            const nextLength = nextProps.content?.length || 0;
            const delta = nextLength - prevLength;

            // For large content, skip re-render if change is tiny (< 50 characters)
            if (nextLength > RENDER_RAW_TEXT_THRESHOLD) {
                if (delta < 50 && delta > 0) {
                    return true; // Skip re-render
                }
            } else if (delta < 20 && delta > 0) {
                // For smaller content, skip only very tiny changes (< 20 chars)
                return true;
            }
        }

        return false; // Props changed significantly, re-render
    }
);

StreamingMarkdownRenderer.displayName = 'StreamingMarkdownRenderer';

/**
 * Internal markdown component (extracted from LumoMarkdown.tsx)
 */
const LumoMarkdownInternal: React.FC<Omit<StreamingMarkdownProps, 'isStreaming'>> = React.memo(
    ({ message, content, onCopy, handleLinkClick, toolCallResults, sourcesContainerRef }) => {
        const { theme } = useLumoTheme();

        // Process REF tokens and convert to links
        const processedContent = useMemo(() => convertRefTokensToSpans(content ?? ''), [content]);

        // Memoized CodeBlock component
        const CodeBlock = useMemo(
            () =>
                React.memo(
                    ({ language, value }: { language: string; value: string }) => {
                        const isLargeCodeBlock = value.length > 3000;
                        const syntaxTheme = theme === ThemeTypes.LumoDark ? oneDark : oneLight;

                        const highlighterOptions = useMemo(
                            () => ({
                                style: syntaxTheme,
                                customStyle: { margin: 0, padding: 0 },
                                codeTagProps: {
                                    style: {
                                        fontFamily: "'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
                                        fontSize: '0.98em',
                                        wordBreak: 'break-all',
                                    },
                                },
                                showLineNumbers: false,
                                wrapLines: !isLargeCodeBlock,
                                wrapLongLines: true,
                                PreTag: 'div' as keyof JSX.IntrinsicElements,
                                ...(isLargeCodeBlock && {
                                    lineProps: { style: { whiteSpace: 'pre' } },
                                }),
                            }),
                            [syntaxTheme, isLargeCodeBlock]
                        );

                        return (
                            <div className="message-container code-container flex flex-row flex-nowrap relative">
                                <div className="flex-auto pr-4">
                                    <SyntaxHighlighter language={language} children={value} {...highlighterOptions} />
                                </div>
                                <div className="lumo-no-copy flex-none z-10" style={{ translate: '4px -4px' }}>
                                    <Copy
                                        shape="ghost"
                                        size="small"
                                        value={value}
                                        onCopy={onCopy}
                                        className="button button-for-icon button-small button-ghost-weak sticky"
                                        style={{ top: '8px', right: 0 }}
                                    />
                                </div>
                            </div>
                        );
                    },
                    (prevProps, nextProps) =>
                        prevProps.language === nextProps.language && prevProps.value === nextProps.value
                ),
            [theme, onCopy]
        );

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

        // Create component renderers
        const renderers = useMemo(
            () => ({
                code(props: any) {
                    const { children, className, ...rest } = props;
                    const match = /language-(\w+)/.exec(className || '');
                    const childrenString = String(children).replace(/\n$/, '');
                    const isMultilineBlock = match || childrenString.trim().includes('\n');

                    if (!isMultilineBlock) {
                        return (
                            <code {...rest} className={className}>
                                {children}
                            </code>
                        );
                    }

                    return <CodeBlock language={match?.[1] ?? 'plaintext'} value={childrenString} />;
                },
                img() {
                    return null; // security
                },
                table(props: any) {
                    return (
                        <div className="markdown-table-wrapper">
                            <table {...props} />
                        </div>
                    );
                },
                a(props: any) {
                    const { href, children } = props;

                    // Handle REF links
                    if (href?.startsWith('#ref-')) {
                        const id = href.substring(5);
                        return <RefLink id={id}>{children}</RefLink>;
                    }

                    // Handle regular links
                    if (!handleLinkClick || !href) {
                        return href;
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
            <Markdown remarkPlugins={[remarkGfm]} skipHtml={true} components={renderers}>
                {processedContent}
            </Markdown>
        );
    }
);

LumoMarkdownInternal.displayName = 'LumoMarkdownInternal';

export default StreamingMarkdownRenderer;

