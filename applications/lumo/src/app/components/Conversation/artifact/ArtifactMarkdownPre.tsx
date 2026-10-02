import { type ComponentPropsWithoutRef, Suspense, lazy } from 'react';
import type { ExtraProps } from 'react-markdown';

import { VegaChartLoading } from '../../LumoMarkdown/vega/VegaChartLoading';
import { readArtifactChartFence } from './artifactCharts';

const VegaLiteChart = lazy(() => {
    return import('../../LumoMarkdown/vega/VegaLiteChart').then((module) => {
        return { default: module.VegaLiteChart };
    });
});

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
