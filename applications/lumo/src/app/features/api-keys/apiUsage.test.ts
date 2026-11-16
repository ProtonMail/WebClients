import type { UsageRow } from './apiUsage';
import { getApiModelUsage, getApiUsageDays, getPeriodDates, getUsageRows, sumUsage } from './apiUsage';

const row = (overrides: Partial<UsageRow>): UsageRow => ({
    Date: '2026-11-01',
    Model: 'lumo-lite',
    ClientType: 'api',
    InputTokens: 0,
    OutputTokens: 0,
    Calls: 0,
    CostMicros: 0,
    ...overrides,
});

describe('getUsageRows', () => {
    it('dates every entry with its day and skips days without usage', () => {
        const { Date: _, ...lite } = row({ InputTokens: 4 });
        const { Date: __, ...max } = row({ Model: 'lumo-max', InputTokens: 9 });

        expect(
            getUsageRows([
                { Date: '2026-11-01', Usage: [] },
                { Date: '2026-11-02', Usage: [lite, max] },
            ])
        ).toEqual([
            { ...lite, Date: '2026-11-02' },
            { ...max, Date: '2026-11-02' },
        ]);
    });
});

describe('sumUsage', () => {
    it('adds the tokens and converts the cost to credits', () => {
        expect(
            sumUsage([
                row({ InputTokens: 15, OutputTokens: 20, CostMicros: 1_500_000 }),
                row({ InputTokens: 1, OutputTokens: 2, CostMicros: 500_000 }),
            ])
        ).toEqual({ inputTokens: 16, outputTokens: 22, cost: 2 });
    });

    it('adds nothing for a model without a known price', () => {
        expect(sumUsage([row({ CostMicros: null }), row({ CostMicros: 250_000 })]).cost).toBe(0.25);
    });
});

describe('getApiUsageDays', () => {
    it('gives one entry per date, with zeros for days without usage', () => {
        expect(getApiUsageDays([row({ Date: '2026-11-02', InputTokens: 3 })], ['2026-11-01', '2026-11-02'])).toEqual([
            { date: '2026-11-01', inputTokens: 0, outputTokens: 0, cost: 0 },
            { date: '2026-11-02', inputTokens: 3, outputTokens: 0, cost: 0 },
        ]);
    });
});

describe('getApiModelUsage', () => {
    it('only counts the rows of that model', () => {
        expect(
            getApiModelUsage(
                [row({ Model: 'lumo-lite', InputTokens: 1 }), row({ Model: 'lumo-max', InputTokens: 7 })],
                'lumo-max'
            )
        ).toEqual({ model: 'lumo-max', inputTokens: 7, outputTokens: 0, cost: 0 });
    });
});

describe('getPeriodDates', () => {
    const dates = Array.from({ length: 90 }, (_, index) => `day-${index}`);

    it.each([
        ['last-7-days', 'day-83', 'day-89', 7],
        ['last-30-days', 'day-60', 'day-89', 30],
        ['previous-30-days', 'day-30', 'day-59', 30],
        ['last-90-days', 'day-0', 'day-89', 90],
    ] as const)('%s runs from %s to %s', (period, first, last, length) => {
        const periodDates = getPeriodDates(dates, period);

        expect(periodDates).toHaveLength(length);
        expect(periodDates[0]).toBe(first);
        expect(periodDates.at(-1)).toBe(last);
    });
});
