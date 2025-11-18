import React, { useEffect, useRef, useState } from 'react';

import type { SearchItem } from '../../../lib/toolCall/types';
import type { Message } from '../../../types';
import { ProgressiveMarkdownRenderer } from './ProgressiveMarkdownRenderer';

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
    handleLinkClick?: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
    toolCallResults?: SearchItem[] | null;
    sourcesContainerRef?: React.RefObject<HTMLDivElement>;
}

/**
 * Throttled markdown renderer that batches updates during streaming
 */
const StreamingMarkdownRenderer: React.FC<StreamingMarkdownProps> = React.memo(
    ({ content, isStreaming = false, handleLinkClick, toolCallResults, sourcesContainerRef }) => {
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

export default StreamingMarkdownRenderer;
