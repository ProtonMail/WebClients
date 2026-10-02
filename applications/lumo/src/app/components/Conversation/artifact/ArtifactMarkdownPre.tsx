import { type ComponentPropsWithoutRef, Suspense, lazy } from 'react';
import type { ExtraProps } from 'react-markdown';

import type { Element } from 'hast';

import { VegaChartLoading } from '../../LumoMarkdown/vega/VegaChartLoading';
import { getCodeBlockLanguage } from '../../LumoMarkdown/vega/codeBlockUtils';
import { isVegaLanguage } from '../../LumoMarkdown/vega/vegaLanguages';

const VegaLiteChart = lazy(() => {
    return import('../../LumoMarkdown/vega/VegaLiteChart').then((module) => {
        return { default: module.VegaLiteChart };
    });
});

/**
 * Strict on purpose (D12): only an explicitly labelled ```vega / ```vega-lite fence becomes a chart.
 * Chat also sniffs ```json and unlabelled blocks for spec-like JSON, but a document may quote a spec
 * as an example, and that must stay code.
 */
export function readArtifactChartFence(node: Element | undefined): { language: string; code: string } | null {
    const code = node?.children[0];
    if (!code || code.type !== 'element' || code.tagName !== 'code') {
        return null;
    }

    const language = getCodeBlockLanguage(undefined, code as { properties?: { className?: string[] } });
    if (!isVegaLanguage(language)) {
        return null;
    }

    const text = code.children
        .map((child) => {
            return child.type === 'text' ? child.value : '';
        })
        .join('')
        .replace(/\n$/, '');

    return { language, code: text };
}

/** `pre` override for artifact markdown: chart fences render as interactive charts, the rest as code. */
interface Props extends ComponentPropsWithoutRef<'pre'>, ExtraProps {}
export const ArtifactMarkdownPre = ({ node, children, ...rest }: Props) => {
    const fence = readArtifactChartFence(node);

    if (fence) {
        return (
            <div className="artifact-markdown-chart my-4">
                <Suspense fallback={<VegaChartLoading />}>
                    <VegaLiteChart code={fence.code} language={fence.language} />
                </Suspense>
            </div>
        );
    }

    return <pre {...rest}>{children}</pre>;
};
