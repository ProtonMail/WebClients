import { Bar, BarChart, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { c } from 'ttag';

import { TOKEN_SERIES, TOKEN_SERIES_FILL } from './ApiTokenUsageLegend';
import { formatTokenCount, shortDayLabel } from './apiKeysHelpers';

export interface ApiTokenUsageChartDay {
    date: string;
    apiInputTokens: number;
    apiOutputTokens: number;
    chatInputTokens?: number;
    chatOutputTokens?: number;
    cost?: number | null;
}

const getDayTokens = (day: ApiTokenUsageChartDay) => TOKEN_SERIES.reduce((sum, { key }) => sum + (day[key] ?? 0), 0);

const getYAxisMaximum = (days: ApiTokenUsageChartDay[]) => {
    const peak = Math.max(0, ...days.map(getDayTokens));
    if (peak === 0) {
        return 1;
    }

    const magnitude = 10 ** Math.floor(Math.log10(peak));
    const step = magnitude / 2;
    return Math.ceil(peak / step) * step;
};

export const ApiTokenUsageChart = ({
    days,
    height = 260,
    formatBalance,
}: {
    days: ApiTokenUsageChartDay[];
    height?: number;
    formatBalance?: (value: number | null) => string;
}) => (
    <ResponsiveContainer width="100%" height={height}>
        <BarChart data={days} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="22%">
            <CartesianGrid strokeDasharray="4 8" stroke="var(--border-weak)" vertical={false} />
            <XAxis
                dataKey="date"
                tickFormatter={shortDayLabel}
                tick={{ fontSize: 11, fill: 'var(--text-weak)' }}
                axisLine={{ stroke: 'var(--border-weak)' }}
                tickLine={false}
                minTickGap={24}
            />
            <YAxis
                domain={[0, getYAxisMaximum(days)]}
                tickFormatter={formatTokenCount}
                tick={{ fontSize: 11, fill: 'var(--text-weak)' }}
                axisLine={false}
                tickLine={false}
                width={44}
            />
            <RechartsTooltip
                cursor={{ fill: 'var(--background-weak)' }}
                content={({ active, payload }) => {
                    if (!active || !payload?.length) {
                        return null;
                    }

                    const day = payload[0].payload as ApiTokenUsageChartDay;
                    return (
                        <div className="api-usage-chart-tooltip flex flex-column gap-1">
                            <strong>{shortDayLabel(day.date)}</strong>
                            {TOKEN_SERIES.filter(({ key }) => day[key]).map(({ key, getLabel }) => (
                                <span key={key}>
                                    {getLabel()}: {formatTokenCount(day[key] ?? 0)}
                                </span>
                            ))}
                            {day.cost !== undefined && formatBalance && (
                                <span>
                                    {c('collider_2025: Label').t`Balance used`}: {formatBalance(day.cost)}
                                </span>
                            )}
                        </div>
                    );
                }}
            />
            {TOKEN_SERIES.map(({ key }) => (
                <Bar key={key} dataKey={key} stackId="tokens" fill={TOKEN_SERIES_FILL[key]} />
            ))}
        </BarChart>
    </ResponsiveContainer>
);
