import type { ReactNode } from 'react';

import type { MarkdownCodeFenceSegment } from '../vega/parseMarkdownCodeFence';
import { shouldRenderAsVegaChart } from '../vega/detectVegaSpec';
import { shouldRenderAsCard } from './detectCardSpec';
import { LumoMarkdownCardBlock } from './LumoMarkdownCardBlock';
import { LumoMetricCardRow } from './LumoMetricCardRow';
import { parseCardRowSegmentCode } from './parseCardRowFence';
import { tryParseCardSpec } from './parseCardSpec';

type CodeSegment = Extract<MarkdownCodeFenceSegment, { type: 'code' }>;

interface RenderCardSegmentOptions {
    segment: MarkdownCodeFenceSegment;
    index: number;
    keyPrefix: string;
    renderVega: (segment: CodeSegment, index: number) => ReactNode;
    renderCode: (segment: CodeSegment, index: number) => ReactNode;
}

export function renderCardAwareSegment({
    segment,
    index,
    keyPrefix,
    renderVega,
    renderCode,
}: RenderCardSegmentOptions): ReactNode | null {
    if (segment.type !== 'code') {
        return null;
    }

    if (segment.language === 'card-row') {
        const cards = parseCardRowSegmentCode(segment.code) ?? [];
        if (cards.length > 0) {
            return <LumoMetricCardRow key={`${keyPrefix}-metric-row-${index}`} cards={cards} />;
        }
    }

    if (shouldRenderAsVegaChart(segment.language, segment.code)) {
        return renderVega(segment, index);
    }

    if (shouldRenderAsCard(segment.language, segment.code)) {
        if (tryParseCardSpec(segment.code)?.type === 'metric') {
            return (
                <LumoMetricCardRow
                    key={`${keyPrefix}-metric-row-${index}`}
                    cards={[{ code: segment.code, language: segment.language || 'card' }]}
                />
            );
        }

        return (
            <LumoMarkdownCardBlock
                key={`${keyPrefix}-card-${index}`}
                code={segment.code}
                language={segment.language || 'card'}
            />
        );
    }

    return renderCode(segment, index);
}
