import { useId } from 'react';

import { Area, AreaChart, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { c } from 'ttag';

import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import type { TokenUsageState } from '../../hooks/usePersonalAccessTokenUsage';
import { ApiTokenUsageChart } from './ApiTokenUsageChart';
import { ApiTokenUsageLegend } from './ApiTokenUsageLegend';
import { ApiUsageMetricCard } from './ApiUsageMetricCard';
import { GHOST_DATA, formatTokenCount, shortDayLabel } from './apiKeysHelpers';

export const UsageSparklineCompact = ({ usage }: { usage: TokenUsageState }) => {
    const sparkId = useId().replace(/:/g, '');
    const { days, totalTokenCount, totalApiCalls, isLoading, error } = usage;

    if (isLoading) {
        return <div className="api-keys-usage-skeleton shrink-0 lumo-bg-control-fill-mid" />;
    }

    const hasUsage = !error && totalTokenCount > 0;

    if (!hasUsage) {
        return (
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
            <div
                className="api-keys-usage flex flex-column items-end gap-1 shrink-0"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="api-keys-usage-chart api-keys-usage-chart--ghost pt-1" aria-hidden="true">
                    <ResponsiveContainer width="100%" height={34}>
                        <AreaChart data={GHOST_DATA} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id={`${sparkId}-ghost`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--lumo-border-mid)" stopOpacity={0.35} />
                                    <stop offset="100%" stopColor="var(--lumo-border-mid)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="TokenCount"
                                stroke="var(--lumo-border-mid)"
                                strokeWidth={1}
                                fill={`url(#${sparkId}-ghost)`}
                                dot={false}
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <span className="api-keys-usage-label lumo-label-small lumo-color-glyph-mid">{c('collider_2025: Info')
                    .t`No usage yet`}</span>
            </div>
        );
    }

    return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div className="api-keys-usage flex flex-column items-end gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <div
                className="api-keys-usage-chart api-keys-usage-chart--spark px-1.5 py-1 border radius-8"
                aria-hidden="true"
            >
                <ResponsiveContainer width="100%" height={34}>
                    <AreaChart data={days} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id={`${sparkId}-spark-fill`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--interaction-norm)" stopOpacity={0.55} />
                                <stop offset="55%" stopColor="var(--interaction-norm)" stopOpacity={0.12} />
                                <stop offset="100%" stopColor="var(--interaction-norm)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area
                            type="monotone"
                            dataKey="TokenCount"
                            stroke="var(--interaction-norm)"
                            strokeWidth={1.75}
                            fill={`url(#${sparkId}-spark-fill)`}
                            dot={false}
                            activeDot={{ r: 3, strokeWidth: 0, fill: 'var(--interaction-norm)' }}
                            isAnimationActive={false}
                        />
                        <RechartsTooltip
                            cursor={{ stroke: 'var(--interaction-norm)', strokeWidth: 1, strokeOpacity: 0.35 }}
                            allowEscapeViewBox={{ x: true, y: true }}
                            offset={8}
                            isAnimationActive={false}
                            wrapperStyle={{ zIndex: 2 }}
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const d = payload[0].payload as { Date: string; TokenCount: number; ApiCalls: number };
                                if (d.TokenCount === 0 && d.ApiCalls === 0) return null;
                                const label = shortDayLabel(d.Date);
                                return (
                                    <div className="api-keys-chart-tooltip api-keys-chart-tooltip--spark flex flex-column gap-0.5 px-3 py-2 border lumo-bg-panel-elevated">
                                        <span className="api-keys-chart-tooltip-date lumo-label-small lumo-color-glyph-mid">
                                            {label}
                                        </span>
                                        <span className="api-keys-chart-tooltip-value lumo-label-small lumo-color-glyph">
                                            {formatTokenCount(d.TokenCount)} {c('collider_2025: Unit').t`tokens`}
                                            {d.ApiCalls > 0 ? (
                                                <>
                                                    {' · '}
                                                    {d.ApiCalls} {c('collider_2025: Unit').t`calls`}
                                                </>
                                            ) : null}
                                        </span>
                                    </div>
                                );
                            }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <div className="flex flex-column items-end gap-0.5">
                <div className="flex items-baseline flex-wrap gap-1 justify-end">
                    <span className="api-keys-usage-total lumo-label-small lumo-color-glyph">
                        {formatTokenCount(totalTokenCount)}
                    </span>
                    <span className="api-keys-usage-label lumo-label-small lumo-color-glyph-mid">{c(
                        'collider_2025: Info'
                    ).t`tokens / 30d`}</span>
                </div>
                <div className="flex items-baseline flex-wrap gap-1 justify-end">
                    <span className="api-keys-usage-total lumo-label-small lumo-color-glyph">
                        {formatTokenCount(totalApiCalls)}
                    </span>
                    <span className="api-keys-usage-label lumo-label-small lumo-color-glyph-mid">{c(
                        'collider_2025: Info'
                    ).t`API calls`}</span>
                </div>
            </div>
        </div>
    );
};

export const ApiKeyUsageExpanded = ({ usage }: { usage: TokenUsageState }) => {
    const { days, totalTokenCount, totalInputTokenCount, totalOutputTokenCount, totalApiCalls, isLoading, error } =
        usage;

    if (isLoading) {
        return (
            <div className="py-2 lumo-body-small lumo-color-glyph-mid">
                {c('collider_2025: Info').t`Loading usage…`}
            </div>
        );
    }

    if (error) {
        return (
            <p className="m-0 lumo-body-small lumo-color-glyph-mid">{c('collider_2025: Error')
                .t`Could not load usage for this key.`}</p>
        );
    }

    if (totalTokenCount === 0 && totalApiCalls === 0) {
        return (
            <div className="api-keys-expanded-empty mt-4 p-4 flex items-center gap-3 border border-dashed radius-12 lumo-bg-panel">
                <span className="api-keys-expanded-empty__icon flex shrink-0 items-center justify-center radius-12 lumo-color-glyph-brand-text lumo-bg-control-fill">
                    <LumoIcon name="Activity" size={18} />
                </span>
                <div className="flex flex-column gap-1">
                    <strong className="lumo-title-small lumo-color-glyph">{c('collider_2025: Title')
                        .t`No usage in the last 30 days`}</strong>
                    <span className="api-keys-expanded-empty__description lumo-label-small lumo-color-glyph-mid">
                        {c('collider_2025: Info')
                            .t`Usage charts and request totals will appear here after this key makes its first API request.`}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-column gap-5 pt-2">
            <div className="api-usage-metrics gap-2.5">
                <ApiUsageMetricCard
                    icon="ArrowDownToLine"
                    label={c('collider_2025: Label').t`Input tokens`}
                    value={formatTokenCount(totalInputTokenCount)}
                    hint={c('collider_2025: Info').t`Last 30 days`}
                />
                <ApiUsageMetricCard
                    icon="ArrowUpFromLine"
                    label={c('collider_2025: Label').t`Output tokens`}
                    value={formatTokenCount(totalOutputTokenCount)}
                    hint={c('collider_2025: Info').t`Last 30 days`}
                />
                <ApiUsageMetricCard
                    icon="Activity"
                    label={c('collider_2025: Label').t`API calls`}
                    value={formatTokenCount(totalApiCalls)}
                    hint={c('collider_2025: Info').t`Last 30 days`}
                />
            </div>

            <div className="flex flex-column gap-2">
                <div className="flex items-center justify-space-between gap-3">
                    <h4 className="m-0 lumo-label-small lumo-color-glyph">{c('collider_2025: Title')
                        .t`Tokens per day`}</h4>
                    <ApiTokenUsageLegend source="api" />
                </div>
                <div className="api-usage-main-chart">
                    <ApiTokenUsageChart
                        days={days.map((day) => ({
                            date: day.Date,
                            apiInputTokens: day.InputTokenCount,
                            apiOutputTokens: day.OutputTokenCount,
                        }))}
                        height={228}
                    />
                </div>
            </div>
        </div>
    );
};
