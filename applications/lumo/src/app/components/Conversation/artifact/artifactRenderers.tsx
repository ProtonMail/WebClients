import { Suspense, lazy, memo } from 'react';

import { c } from 'ttag';

import { useLumoTheme } from '../../../providers';
import type { ParsedArtifact } from './parseArtifacts';

// Lazy-load the syntax highlighter to keep the initial bundle small
const LumoMarkdownCodeBlockHighlighter = lazy(() => import('../../LumoMarkdown/LumoMarkdownCodeBlockHighlighter'));

// Lazy-load react-markdown for document rendering
const MarkdownRenderer = lazy(() =>
    import('react-markdown').then((mod) => ({
        default: (props: { children: string }) => {
            const Markdown = mod.default;
            return <Markdown>{props.children}</Markdown>;
        },
    }))
);

export interface ArtifactRendererProps {
    artifact: ParsedArtifact;
    showLineNumbers?: boolean;
}

const ArtifactMarkdownBody = memo(function ArtifactMarkdownBody({ content }: { content: string }) {
    return (
        <Suspense
            fallback={
                <pre className="text-monospace text-sm m-0 overflow-auto color-norm whitespace-pre-wrap">{content}</pre>
            }
        >
            <div className="artifact-markdown prose">
                <MarkdownRenderer>{content}</MarkdownRenderer>
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
