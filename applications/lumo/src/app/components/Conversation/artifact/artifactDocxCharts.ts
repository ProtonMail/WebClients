import type { DocxLocalImage } from '../../../util/docx/markdownToDocx';
import { readChartSpecTitle } from '../../LumoMarkdown/vega/chartSpecTitle';
import { replaceCompleteMarkdownCodeFences } from '../../LumoMarkdown/vega/parseMarkdownCodeFence';
import { renderVegaSpecToPng } from '../../LumoMarkdown/vega/renderVegaSpecToSvg';
import { isVegaLanguage } from '../../LumoMarkdown/vega/vegaLanguages';
import { chartSpecToMarkdown } from './artifactCharts';

export interface DocxChartContent {
    markdown: string;
    localImages: Map<string, DocxLocalImage>;
}

function escapeImageAlt(text: string): string {
    return text.replace(/([\\[\]])/g, '\\$1').replace(/\r?\n/g, ' ');
}

function randomKeyPrefix(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(8));
    return Array.from(bytes, (byte) => {
        return byte.toString(16).padStart(2, '0');
    }).join('');
}

/**
 * Word export of charts (D12): each explicit ```vega / ```vega-lite fence is rendered to a PNG (the
 * docx version in use embeds only raster images) and replaced by a markdown image whose URL is a
 * per-export random key into `localImages`, so model-written image links can never match one. A
 * chart that fails to render becomes its title, subtitle and data table instead.
 */
export async function prepareDocxCharts(markdown: string): Promise<DocxChartContent> {
    const specs: string[] = [];
    replaceCompleteMarkdownCodeFences(markdown, (fence) => {
        if (isVegaLanguage(fence.language)) {
            specs.push(fence.code);
        }
        return null;
    });

    const localImages = new Map<string, DocxLocalImage>();
    if (specs.length === 0) {
        return { markdown, localImages };
    }

    const rendered = await Promise.all(
        specs.map((spec) => {
            return renderVegaSpecToPng(spec).catch(() => {
                return null;
            });
        })
    );

    const keyPrefix = `lumo-chart-${randomKeyPrefix()}`;
    let index = 0;
    const result = replaceCompleteMarkdownCodeFences(markdown, (fence) => {
        if (!isVegaLanguage(fence.language)) {
            return null;
        }
        const chartIndex = index++;
        const image = rendered[chartIndex];
        if (!image) {
            return chartSpecToMarkdown(fence.code);
        }

        const key = `${keyPrefix}-${chartIndex}`;
        localImages.set(key, image);
        const { text, subtitle } = readChartSpecTitle(fence.code);
        const alt = [text, subtitle].filter(Boolean).join(' — ') || 'Chart';
        return `![${escapeImageAlt(alt)}](${key})`;
    });

    return { markdown: result, localImages };
}
