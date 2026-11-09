import { type ComponentPropsWithoutRef, Suspense, lazy } from 'react';
import type { ExtraProps } from 'react-markdown';

import { VegaChartLoading } from '../../LumoMarkdown/vega/VegaChartLoading';
import { ArtifactCodeCopyButton } from './ArtifactCodeCopyButton';
import { readArtifactChartFence, readArtifactCodeFence } from './artifactCharts';

const VegaLiteChart = lazy(() => {
    return import('../../LumoMarkdown/vega/VegaLiteChart').then((module) => {
        return { default: module.VegaLiteChart };
    });
});

/**
 * `pre` override for artifact markdown: chart fences render as interactive charts, the rest as code
 * with a copy control.
 */
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

    const codeFence = readArtifactCodeFence(node);
    if (!codeFence) {
        return <pre {...rest}>{children}</pre>;
    }

    // The button sits beside the <pre>, not inside it, so it stays put when a long line scrolls sideways.
    // Both share one grid cell (ArtifactPanel.scss), so the sticky button stays pinned while a tall block
    // scrolls past but never leaves the block's box.
    return (
        <div className="artifact-code-fence group-hover-opacity-container">
            <pre {...rest}>{children}</pre>
            <ArtifactCodeCopyButton code={codeFence.code} className="artifact-code-fence-copy m-2" />
        </div>
    );
};
