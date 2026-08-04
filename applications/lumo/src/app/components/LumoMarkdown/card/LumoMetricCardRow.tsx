import { clsx } from 'clsx';

import { LUMO_MARKDOWN_CARD_SHELL_CLASS } from '../lumoMarkdownCardShell';
import { LumoInsightCard } from './LumoInsightCard';
import { getMetricRowColumnCount } from './metricCardRowUtils';
import { tryParseCardSpec } from './parseCardSpec';

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

export const LumoMetricCardRow = ({ cards, pendingSlot = false }: LumoMetricCardRowProps) => {
    // Grid columns are sized from the cards that actually render, so an unparseable
    // card shrinks the row instead of leaving an empty cell behind.
    const renderableCards = cards.flatMap((card, index) => {
        const spec = tryParseCardSpec(card.code);
        return spec ? [{ spec, key: spec.title || `metric-${index}` }] : [];
    });

    if (renderableCards.length === 0 && !pendingSlot) {
        return null;
    }

    const columnCount = getMetricRowColumnCount(renderableCards.length, pendingSlot);
    const reservedSlots = renderableCards.length + (pendingSlot ? 1 : 0);
    const placeholderCount = pendingSlot && reservedSlots < columnCount ? columnCount - reservedSlots : 0;

    return (
        <div
            className={clsx(
                'lumo-metric-card-row grid items-stretch gap-3 w-full my-2 mb-3',
                `lumo-metric-card-row--${columnCount}`
            )}
        >
            {renderableCards.map(({ spec, key }) => (
                <div key={key} className="lumo-insight-card-block flex min-w-0">
                    <LumoInsightCard spec={spec} />
                </div>
            ))}
            {pendingSlot ? <MetricCardSkeleton key="metric-pending" /> : null}
            {Array.from({ length: placeholderCount }, (_, index) => (
                <MetricCardSkeleton key={`metric-placeholder-${index}`} />
            ))}
        </div>
    );
};
