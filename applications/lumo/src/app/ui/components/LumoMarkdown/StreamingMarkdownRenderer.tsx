import React, { useEffect, useRef, useState } from 'react';

import type { SearchItem } from '../../../lib/toolCall/types';
import type { Message } from '../../../types';
import { LazyProgressiveMarkdownRenderer } from './LazyMarkdownComponents';

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

const STREAMING_UPDATE_INTERVAL_MS = 20; // Update every X ms during streaming (smoother)

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
    ({ content, isStreaming = false, handleLinkClick, toolCallResults, sourcesContainerRef, message }) => {
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

            if (timeSinceLastUpdate < STREAMING_UPDATE_INTERVAL_MS) {
                // Too soon, schedule for later
                if (frameRef.current) {
                    cancelAnimationFrame(frameRef.current);
                }

                frameRef.current = requestAnimationFrame(() => {
                    const remaining = STREAMING_UPDATE_INTERVAL_MS - (Date.now() - lastUpdateRef.current);
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
            <LazyProgressiveMarkdownRenderer
                content={displayContent}
                isStreaming={effectiveIsStreaming}
                handleLinkClick={handleLinkClick}
                toolCallResults={toolCallResults}
                sourcesContainerRef={sourcesContainerRef}
                message={message}
            />
        );
    },
    (prevProps, nextProps) => {
        // Custom comparison to prevent unnecessary re-renders
        const contentChanged = prevProps.content !== nextProps.content;

        // Only re-render if content changed
        // Note: We ignore isStreaming changes because we use effectiveIsStreaming internally
        // which is locked after initial render. This prevents flickering cursor on stream end.
        return !contentChanged; // If props are equal, skip re-render (return true means skip)
    }
);

StreamingMarkdownRenderer.displayName = 'StreamingMarkdownRenderer';

export default StreamingMarkdownRenderer;
