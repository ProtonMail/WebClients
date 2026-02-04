import React, { Suspense, lazy } from 'react';

import type { SearchItem } from '../../../lib/toolCall/types';
import type { Message } from '../../../types';

// Lazy load the markdown components to avoid loading katex, react-markdown, remark-gfm in initial bundle
const ProgressiveMarkdownRenderer = lazy(() => import('./ProgressiveMarkdownRenderer'));
const LumoMarkdown = lazy(() => import('./LumoMarkdown'));

interface ProgressiveMarkdownProps {
    content: string;
    isStreaming: boolean;
    handleLinkClick?: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
    toolCallResults?: SearchItem[] | null;
    sourcesContainerRef?: React.RefObject<HTMLDivElement>;
}

interface LumoMarkdownProps {
    message: Message;
    content: string | undefined;
    onCopy?: () => void;
    handleLinkClick?: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
    toolCallResults?: SearchItem[] | null;
    sourcesContainerRef?: React.RefObject<HTMLDivElement>;
}

// Simple loading fallback that matches the markdown content area
const MarkdownLoadingFallback: React.FC = () => {
    return (
        <div className="progressive-markdown-content" style={{ minHeight: '1em' }}>
            {/* Empty fallback - prevents layout shift */}
        </div>
    );
};

/**
 * Lazy-loaded Progressive Markdown Renderer
 *
 * This wrapper lazy-loads the markdown rendering stack (react-markdown, katex, remark-gfm, etc.)
 * Only when markdown content needs to be displayed.
 *
 * Benefits:
 * - Reduces initial bundle size by ~500KB
 * - Faster initial page load
 * - Markdown libraries only loaded when first message is rendered
 */
export const LazyProgressiveMarkdownRenderer: React.FC<ProgressiveMarkdownProps> = (props) => {
    return (
        <Suspense fallback={<MarkdownLoadingFallback />}>
            <ProgressiveMarkdownRenderer {...props} />
        </Suspense>
    );
};

/**
 * Lazy-loaded Lumo Markdown
 *
 * Same lazy-loading benefits as LazyProgressiveMarkdownRenderer
 */
export const LazyLumoMarkdown: React.FC<LumoMarkdownProps> = (props) => {
    return (
        <Suspense fallback={<MarkdownLoadingFallback />}>
            <LumoMarkdown {...props} />
        </Suspense>
    );
};
