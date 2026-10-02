import { Suspense, lazy, memo, useMemo } from 'react';

import { c } from 'ttag';

import { useLumoTheme } from '../../../providers';
import { ArtifactMarkdownPre } from './ArtifactMarkdownPre';
import { normalizeDocumentCardFences } from './artifactVizCards';
import type { ParsedArtifact } from './parseArtifacts';

// Lazy-load the syntax highlighter to keep the initial bundle small
const LumoMarkdownCodeBlockHighlighter = lazy(() => import('../../LumoMarkdown/LumoMarkdownCodeBlockHighlighter'));

// Lazy-load react-markdown for document rendering. remark-gfm (tables, strikethrough, task lists) is
// the same plugin set export uses (artifactMarkdownHtml.ts), so the preview shows what PDF/Drive get.
// `pre` renders ```vega-lite fences as charts (D12).
const MARKDOWN_COMPONENTS = { pre: ArtifactMarkdownPre };

const MarkdownRenderer = lazy(() =>
    Promise.all([import('react-markdown'), import('remark-gfm')]).then(([markdownModule, gfmModule]) => ({
        default: (props: { children: string }) => {
            const Markdown = markdownModule.default;
            return (
                <Markdown remarkPlugins={[gfmModule.default]} components={MARKDOWN_COMPONENTS}>
                    {props.children}
                </Markdown>
            );
        },
    }))
);

export interface ArtifactRendererProps {
    artifact: ParsedArtifact;
    showLineNumbers?: boolean;
}

const ArtifactMarkdownBody = memo(function ArtifactMarkdownBody({ content }: { content: string }) {
    // Chat-only card fences leak into documents as raw JSON; show them as a table / quote instead.
    // Read time only: the stored artifact keeps what the model emitted (D12).
    const displayContent = useMemo(() => {
        return normalizeDocumentCardFences(content);
    }, [content]);

    return (
        <Suspense
            fallback={
                <pre className="text-monospace text-sm m-0 overflow-auto color-norm whitespace-pre-wrap">{content}</pre>
            }
        >
            <div className="artifact-markdown prose">
                <MarkdownRenderer>{displayContent}</MarkdownRenderer>
            </div>
        </Suspense>
    );
});

export const CodeRenderer = memo(function CodeRenderer({ artifact, showLineNumbers }: ArtifactRendererProps) {
    const { theme } = useLumoTheme();

    if (!artifact.content) {
        return <p className="color-hint text-sm p-4">{c('collider_2025:Info').t`No content generated`}</p>;
    }

    return (
        <div className="artifact-code-content overflow-auto flex-1 min-h-0 min-w-0 w-full h-full">
            <Suspense
                fallback={
                    <pre className="text-monospace text-sm m-0 p-4 overflow-auto color-norm">{artifact.content}</pre>
                }
            >
                <div className={showLineNumbers ? 'artifact-code--line-numbers' : undefined}>
                    <LumoMarkdownCodeBlockHighlighter
                        code={artifact.content}
                        language={artifact.language ?? 'text'}
                        theme={theme}
                    />
                </div>
            </Suspense>
        </div>
    );
});

export const DocumentRenderer = memo(function DocumentRenderer({ artifact }: ArtifactRendererProps) {
    if (!artifact.content) {
        return <p className="color-hint text-sm p-4">{c('collider_2025:Info').t`No content generated`}</p>;
    }

    return (
        <div className="artifact-document-content overflow-auto flex-1 min-h-0 min-w-0 w-full h-full p-4">
            <ArtifactMarkdownBody content={artifact.content} />
        </div>
    );
});
