import type { MetricCardFence } from './metricCardTypes';

const MIN_COLUMNS = 2;
const MAX_COLUMNS = 4;

/** Grid columns for a KPI strip — matches card count (2–4) so cards share width evenly. */
export function getMetricRowColumnCount(cardCount: number, pendingSlot = false): number {
    const reservedSlots = cardCount + (pendingSlot ? 1 : 0);
    if (reservedSlots <= 1) {
        return 1;
    }

    return Math.min(MAX_COLUMNS, Math.max(MIN_COLUMNS, reservedSlots));
}

export function isMetricCardFence(fence: MetricCardFence): boolean {
    try {
        const parsed = JSON.parse(fence.code) as { type?: string };
        return parsed.type === 'metric';
    } catch {
        return false;
    }
}
