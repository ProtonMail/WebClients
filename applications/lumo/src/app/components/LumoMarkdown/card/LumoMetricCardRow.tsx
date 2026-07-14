import clsx from 'clsx';

import { LUMO_MARKDOWN_CARD_SHELL_CLASS } from '../lumoMarkdownCardShell';
import { tryParseCardSpec } from './parseCardSpec';
import { getMetricRowColumnCount } from './metricCardRowUtils';
import { LumoMarkdownCardBlock } from './LumoMarkdownCardBlock';

interface LumoMetricCardRowProps {
    cards: { code: string; language: string }[];
    pendingSlot?: boolean;
}

function MetricCardSkeleton() {
    return (
        <div className="lumo-insight-card-block flex min-w-0">
            <div
                className={clsx(
                    LUMO_MARKDOWN_CARD_SHELL_CLASS,
                    'lumo-insight-card lumo-insight-card--metric lumo-insight-card--skeleton flex flex-1 flex-column min-h-full w-full p-4'
                )}
            >
                <div className="lumo-insight-card__label">
                    <span className="lumo-insight-card__shimmer">&nbsp;</span>
                </div>
                <div className="lumo-insight-card__value lumo-insight-card__shimmer">&nbsp;</div>
                <div className="lumo-insight-card__delta lumo-insight-card__shimmer">&nbsp;</div>
            </div>
        </div>
    );
}

function metricCardKey(card: { code: string; language: string }, index: number): string {
    return tryParseCardSpec(card.code)?.title ?? `metric-${index}`;
}

export const LumoMetricCardRow = ({ cards, pendingSlot = false }: LumoMetricCardRowProps) => {
    const columnCount = getMetricRowColumnCount(cards.length, pendingSlot);
    const reservedSlots = cards.length + (pendingSlot ? 1 : 0);
    const placeholderCount =
        pendingSlot && reservedSlots < columnCount ? columnCount - reservedSlots : 0;

    return (
        <div className={clsx('lumo-metric-card-row grid items-stretch gap-3 w-full my-2 mb-3', `lumo-metric-card-row--${columnCount}`)}>
            {cards.map((card, index) => (
                <LumoMarkdownCardBlock
                    key={metricCardKey(card, index)}
                    code={card.code}
                    language={card.language}
                />
            ))}
            {pendingSlot ? <MetricCardSkeleton key="metric-pending" /> : null}
            {Array.from({ length: placeholderCount }, (_, index) => (
                <MetricCardSkeleton key={`metric-placeholder-${index}`} />
            ))}
        </div>
    );
};
