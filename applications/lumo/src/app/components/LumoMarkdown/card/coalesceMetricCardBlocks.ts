import {
    blockContainsCompleteCodeFence,
    parseMarkdownCodeFence,
    splitMarkdownWithCompleteCodeFences,
} from '../vega/parseMarkdownCodeFence';
import { shouldRenderAsVegaChart } from '../vega/detectVegaSpec';
import { parseCardRowFence, parseCardRowSegmentCode } from './parseCardRowFence';
import type { MetricCardFence } from './metricCardTypes';

export type { MetricCardFence } from './metricCardTypes';
export { parseCardRowFence } from './parseCardRowFence';

const METRIC_SECTION_KEY = 'metric-section';

function blockContainsVegaChart(content: string): boolean {
    const trimmed = content.trim();
    const fence = parseMarkdownCodeFence(trimmed);
    if (fence && shouldRenderAsVegaChart(fence.language, fence.code)) {
        return true;
    }

    if (!blockContainsCompleteCodeFence(content)) {
        return false;
    }

    const fencePattern = /```([\w-]+)?[ \t]*\n([\s\S]*?)\n```/g;
    for (const match of content.matchAll(fencePattern)) {
        const language = match[1]?.toLowerCase() ?? '';
        const code = match[2] ?? '';
        if (shouldRenderAsVegaChart(language, code)) {
            return true;
        }
    }

    return false;
}

function rebuildFence(language: string, code: string): string {
    return `\`\`\`${language || 'card'}\n${code}\n\`\`\``;
}

function expandMixedContentBlock(block: ContentBlockLike): MarkdownRenderUnit[] | null {
    if (!blockContainsCompleteCodeFence(block.content)) {
        return null;
    }

    if (parseMarkdownCodeFence(block.content.trim())) {
        return null;
    }

    const units: MarkdownRenderUnit[] = [];

    for (const [index, segment] of splitMarkdownWithCompleteCodeFences(block.content).entries()) {
        if (segment.type === 'markdown') {
            if (!segment.content.trim()) {
                continue;
            }

            units.push({
                kind: 'block',
                block: {
                    ...block,
                    content: segment.content,
                    key: `${block.key}-md-${index}`,
                },
            });
            continue;
        }

        if (segment.language === 'card-row') {
            const cards = parseCardRowSegmentCode(segment.code);
            if (cards && cards.length > 0) {
                units.push({
                    kind: 'metric-row',
                    cards,
                    key: METRIC_SECTION_KEY,
                });
            }
            continue;
        }

        units.push({
            kind: 'block',
            block: {
                ...block,
                content: rebuildFence(segment.language, segment.code),
                key: `${block.key}-code-${index}`,
            },
        });
    }

    return units.length > 0 ? units : null;
}

export interface ContentBlockLike {
    type: 'complete' | 'incomplete';
    content: string;
    key: string;
}

export type MarkdownRenderUnit =
    | { kind: 'block'; block: ContentBlockLike }
    | { kind: 'metric-row'; cards: MetricCardFence[]; key: string; pendingSlot?: boolean };

/** Map split markdown blocks into render units, promoting ```card-row fences to KPI rows. */
export function buildMarkdownRenderUnits(blocks: ContentBlockLike[]): MarkdownRenderUnit[] {
    const units: MarkdownRenderUnit[] = [];

    for (const block of blocks) {
        if (block.type !== 'complete') {
            if (block.content.trim()) {
                units.push({ kind: 'block', block });
            }
            continue;
        }

        const expanded = expandMixedContentBlock(block);
        if (expanded) {
            units.push(...expanded);
            continue;
        }

        const cardRow = parseCardRowFence(block.content);
        if (cardRow && cardRow.length > 0) {
            units.push({
                kind: 'metric-row',
                cards: cardRow,
                key: METRIC_SECTION_KEY,
            });
            continue;
        }

        if (blockContainsVegaChart(block.content) || block.content.trim()) {
            units.push({ kind: 'block', block });
        }
    }

    return units;
}
