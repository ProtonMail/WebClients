import type { UsageDay, UsageEntry } from '../../remote/usage';
import type { ApiTokenPricingModelId } from '../api-docs/apiTokenPricingUsd';

export type UsageRow = UsageEntry & { Date: string };

type ApiUsageTotals = {
    inputTokens: number;
    outputTokens: number;
    cost: number;
};

export type ApiUsageDay = ApiUsageTotals & { date: string };

export type UsagePeriod = 'last-7-days' | 'last-30-days' | 'previous-30-days' | 'last-90-days';

const PERIOD_DATE_SLICES: Record<UsagePeriod, [number, number?]> = {
    'last-7-days': [-7],
    'last-30-days': [-30],
    'previous-30-days': [-60, -30],
    'last-90-days': [-90],
};

export const getPeriodDates = (dates: string[], period: UsagePeriod) => dates.slice(...PERIOD_DATE_SLICES[period]);

export const getUsageRows = (days: UsageDay[]): UsageRow[] =>
    days.flatMap((day) => day.Usage.map((entry) => ({ ...entry, Date: day.Date })));

const CREDIT_MICROS = 1_000_000;

export const sumUsage = (rows: UsageRow[]): ApiUsageTotals => ({
    inputTokens: rows.reduce((sum, row) => sum + row.InputTokens, 0),
    outputTokens: rows.reduce((sum, row) => sum + row.OutputTokens, 0),
    cost: rows.reduce((sum, row) => sum + (row.CostMicros ?? 0), 0) / CREDIT_MICROS,
});

export const getApiUsageDays = (rows: UsageRow[], dates: string[]): ApiUsageDay[] =>
    dates.map((date) => ({ date, ...sumUsage(rows.filter((row) => row.Date === date)) }));

export const getApiModelUsage = (rows: UsageRow[], model: ApiTokenPricingModelId) => ({
    model,
    ...sumUsage(rows.filter((row) => row.Model === model)),
});
