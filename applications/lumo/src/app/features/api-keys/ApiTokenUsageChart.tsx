import { Bar, BarChart, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { c } from 'ttag';

import { formatTokenCount, shortDayLabel } from './apiKeysHelpers';

export interface ApiTokenUsageChartDay {
    date: string;
    inputTokens: number;
    outputTokens: number;
    balanceUsed?: number;
}

const getYAxisMaximum = (days: ApiTokenUsageChartDay[]) => {
    const peak = Math.max(0, ...days.map((day) => day.inputTokens + day.outputTokens));
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
    formatBalance?: (value: number) => string;
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
                            <span>
                                {c('collider_2025: Label').t`Input`}: {formatTokenCount(day.inputTokens)}
                            </span>
                            <span>
                                {c('collider_2025: Label').t`Output`}: {formatTokenCount(day.outputTokens)}
                            </span>
                            {day.balanceUsed !== undefined && formatBalance && (
                                <span>
                                    {c('collider_2025: Label').t`Balance used`}: {formatBalance(day.balanceUsed)}
                                </span>
                            )}
                        </div>
                    );
                }}
            />
            <Bar dataKey="inputTokens" stackId="tokens" fill="var(--interaction-norm)" />
            <Bar dataKey="outputTokens" stackId="tokens" fill="var(--signal-success)" radius={[5, 5, 0, 0]} />
        </BarChart>
    </ResponsiveContainer>
);
