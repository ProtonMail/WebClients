import { useId, useMemo } from 'react';

import { c } from 'ttag';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    XAxis,
    YAxis,
} from 'recharts';

import type { TokenUsageState } from '../../hooks/usePersonalAccessTokenUsage';
import {
    formatAvgTokensPerCall,
    formatTokenCount,
    GHOST_DATA,
    shortDayLabel,
} from './apiKeysHelpers';

export const UsageSparklineCompact = ({ usage }: { usage: TokenUsageState }) => {
    const sparkId = useId().replace(/:/g, '');
    const { days, totalTokenCount, totalApiCalls, isLoading, error } = usage;

    if (isLoading) {
        return <div className="api-keys-usage-skeleton" />;
    }

    const hasUsage = !error && totalTokenCount > 0;

    if (!hasUsage) {
        return (
            <div className="api-keys-usage flex flex-column items-end gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <div className="api-keys-usage-chart api-keys-usage-chart--ghost" aria-hidden="true">
                    <ResponsiveContainer width="100%" height={34}>
                        <AreaChart data={GHOST_DATA} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id={`${sparkId}-ghost`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--border-norm)" stopOpacity={0.35} />
                                    <stop offset="100%" stopColor="var(--border-norm)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="TokenCount"
                                stroke="var(--border-norm)"
                                strokeWidth={1}
                                fill={`url(#${sparkId}-ghost)`}
                                dot={false}
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <span className="api-keys-usage-label">{c('collider_2025: Info').t`No usage yet`}</span>
            </div>
        );
    }

    return (
        <div className="api-keys-usage flex flex-column items-end gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <div className="api-keys-usage-chart api-keys-usage-chart--spark" aria-hidden="true">
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
                                const label = new Date(d.Date).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                });
                                return (
                                    <div className="api-keys-chart-tooltip api-keys-chart-tooltip--spark flex flex-column gap-0.5">
                                        <span className="api-keys-chart-tooltip-date">{label}</span>
                                        <span className="api-keys-chart-tooltip-value">
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
                    <span className="api-keys-usage-total">{formatTokenCount(totalTokenCount)}</span>
                    <span className="api-keys-usage-label">{c('collider_2025: Info').t`tokens / 30d`}</span>
                </div>
                <div className="flex items-baseline flex-wrap gap-1 justify-end">
                    <span className="api-keys-usage-total">{formatTokenCount(totalApiCalls)}</span>
                    <span className="api-keys-usage-label">{c('collider_2025: Info').t`API calls`}</span>
                </div>
            </div>
        </div>
    );
};

export const ApiKeyUsageExpanded = ({ usage }: { usage: TokenUsageState }) => {
    const chartUid = useId().replace(/:/g, '');
    const { days, totalTokenCount, totalApiCalls, isLoading, error } = usage;
    const avgTokensPerCall = totalApiCalls > 0 ? totalTokenCount / totalApiCalls : 0;
    const tokensPerCallData = useMemo(
        () =>
            days.map((d) => ({
                ...d,
                TokensPerCall: d.ApiCalls > 0 ? Math.round((d.TokenCount / d.ApiCalls) * 100) / 100 : 0,
            })),
        [days]
    );

    if (isLoading) {
        return (
            <div className="api-keys-expanded-loading color-weak text-sm">
                {c('collider_2025: Info').t`Loading usage…`}
            </div>
        );
    }

    if (error) {
        return (
            <p className="m-0 text-sm color-weak">
                {c('collider_2025: Error').t`Could not load usage for this key.`}
            </p>
        );
    }

    return (
        <div className="flex flex-column gap-5 pt-2">
            <div className="api-keys-expanded-stats">
                <div className="api-keys-stat flex flex-column gap-1 p-3 rounded-lg border border-weak bg-norm">
                    <span className="api-keys-stat-value">{formatTokenCount(totalTokenCount)}</span>
                    <span className="api-keys-stat-label">{c('collider_2025: Label').t`Tokens (30d)`}</span>
                </div>
                <div className="api-keys-stat flex flex-column gap-1 p-3 rounded-lg border border-weak bg-norm">
                    <span className="api-keys-stat-value">{formatTokenCount(totalApiCalls)}</span>
                    <span className="api-keys-stat-label">{c('collider_2025: Label').t`API calls (30d)`}</span>
                </div>
                <div className="api-keys-stat flex flex-column gap-1 p-3 rounded-lg border border-weak bg-norm">
                    <span className="api-keys-stat-value">{formatAvgTokensPerCall(avgTokensPerCall)}</span>
                    <span className="api-keys-stat-label">{c('collider_2025: Label').t`Avg tokens / call`}</span>
                </div>
            </div>

            <div className="flex flex-column gap-2">
                <h4 className="api-keys-expanded-chart-title m-0">{c('collider_2025: Title').t`Tokens per day`}</h4>
                <div className="api-keys-expanded-chart api-keys-expanded-chart--elevated">
                    <ResponsiveContainer width="100%" height={228}>
                        <AreaChart data={days} margin={{ top: 14, right: 10, left: 4, bottom: 4 }}>
                            <defs>
                                <linearGradient id={`${chartUid}-tokens-area`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--interaction-norm)" stopOpacity={0.45} />
                                    <stop offset="75%" stopColor="var(--interaction-norm)" stopOpacity={0.08} />
                                    <stop offset="100%" stopColor="var(--interaction-norm)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="4 8" stroke="var(--border-weak)" vertical={false} strokeOpacity={0.85} />
                            <XAxis
                                dataKey="Date"
                                tickFormatter={shortDayLabel}
                                tick={{ fontSize: 11, fill: 'var(--text-weak)' }}
                                axisLine={{ stroke: 'var(--border-weak)' }}
                                tickLine={false}
                                interval="preserveStartEnd"
                                minTickGap={20}
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: 'var(--text-weak)' }}
                                width={46}
                                axisLine={false}
                                tickLine={false}
                            />
                            <RechartsTooltip
                                cursor={{ stroke: 'var(--interaction-norm)', strokeWidth: 1, strokeOpacity: 0.35 }}
                                content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null;
                                    const d = payload[0].payload as { Date: string; TokenCount: number };
                                    return (
                                        <div className="api-keys-chart-tooltip api-keys-chart-tooltip--expanded api-keys-chart-tooltip--accent-tokens flex flex-column gap-0.5">
                                            <span className="api-keys-chart-tooltip-date">{shortDayLabel(d.Date)}</span>
                                            <span className="api-keys-chart-tooltip-value">
                                                {formatTokenCount(d.TokenCount)} {c('collider_2025: Unit').t`tokens`}
                                            </span>
                                        </div>
                                    );
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="TokenCount"
                                stroke="var(--interaction-norm)"
                                strokeWidth={2.5}
                                fill={`url(#${chartUid}-tokens-area)`}
                                dot={false}
                                activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--background-norm)', fill: 'var(--interaction-norm)' }}
                                animationDuration={520}
                                animationEasing="ease-out"
                                isAnimationActive
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="flex flex-column gap-2">
                <h4 className="api-keys-expanded-chart-title m-0">{c('collider_2025: Title').t`API calls per day`}</h4>
                <div className="api-keys-expanded-chart api-keys-expanded-chart--elevated">
                    <ResponsiveContainer width="100%" height={228}>
                        <BarChart data={days} margin={{ top: 14, right: 10, left: 4, bottom: 4 }} barCategoryGap="28%">
                            <defs>
                                <linearGradient id={`${chartUid}-calls-bar`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--signal-success)" stopOpacity={1} />
                                    <stop offset="100%" stopColor="var(--signal-success)" stopOpacity={0.45} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="4 8" stroke="var(--border-weak)" vertical={false} strokeOpacity={0.85} />
                            <XAxis
                                dataKey="Date"
                                tickFormatter={shortDayLabel}
                                tick={{ fontSize: 11, fill: 'var(--text-weak)' }}
                                axisLine={{ stroke: 'var(--border-weak)' }}
                                tickLine={false}
                                interval="preserveStartEnd"
                                minTickGap={20}
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: 'var(--text-weak)' }}
                                width={46}
                                axisLine={false}
                                tickLine={false}
                            />
                            <RechartsTooltip
                                cursor={{ fill: 'var(--signal-success-minor-2, rgb(16 185 129 / 0.12))' }}
                                content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null;
                                    const d = payload[0].payload as { Date: string; ApiCalls: number };
                                    return (
                                        <div className="api-keys-chart-tooltip api-keys-chart-tooltip--expanded api-keys-chart-tooltip--accent-calls flex flex-column gap-0.5">
                                            <span className="api-keys-chart-tooltip-date">{shortDayLabel(d.Date)}</span>
                                            <span className="api-keys-chart-tooltip-value">
                                                {d.ApiCalls} {c('collider_2025: Unit').t`calls`}
                                            </span>
                                        </div>
                                    );
                                }}
                            />
                            <Bar
                                dataKey="ApiCalls"
                                fill={`url(#${chartUid}-calls-bar)`}
                                radius={[8, 8, 0, 0]}
                                maxBarSize={18}
                                animationDuration={520}
                                animationEasing="ease-out"
                                isAnimationActive
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="flex flex-column gap-2">
                <h4 className="api-keys-expanded-chart-title m-0">{c('collider_2025: Title').t`Tokens per call (daily)`}</h4>
                <p className="api-keys-expanded-hint text-sm color-weak m-0 mb-2">
                    {c('collider_2025: Info')
                        .t`For each day, average tokens per API call (tokens ÷ calls, or 0 if no calls).`}
                </p>
                <div className="api-keys-expanded-chart api-keys-expanded-chart--elevated">
                    <ResponsiveContainer width="100%" height={228}>
                        <BarChart data={tokensPerCallData} margin={{ top: 14, right: 10, left: 4, bottom: 4 }} barCategoryGap="28%">
                            <defs>
                                <linearGradient id={`${chartUid}-tpc-bar`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--signal-warning)" stopOpacity={1} />
                                    <stop offset="100%" stopColor="var(--signal-warning)" stopOpacity={0.4} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="4 8" stroke="var(--border-weak)" vertical={false} strokeOpacity={0.85} />
                            <XAxis
                                dataKey="Date"
                                tickFormatter={shortDayLabel}
                                tick={{ fontSize: 11, fill: 'var(--text-weak)' }}
                                axisLine={{ stroke: 'var(--border-weak)' }}
                                tickLine={false}
                                interval="preserveStartEnd"
                                minTickGap={20}
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: 'var(--text-weak)' }}
                                width={46}
                                axisLine={false}
                                tickLine={false}
                            />
                            <RechartsTooltip
                                cursor={{ fill: 'var(--signal-warning-minor-2, rgb(245 158 11 / 0.12))' }}
                                content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null;
                                    const d = payload[0].payload as {
                                        Date: string;
                                        TokensPerCall: number;
                                        ApiCalls: number;
                                    };
                                    return (
                                        <div className="api-keys-chart-tooltip api-keys-chart-tooltip--expanded api-keys-chart-tooltip--accent-tpc flex flex-column gap-0.5">
                                            <span className="api-keys-chart-tooltip-date">{shortDayLabel(d.Date)}</span>
                                            <span className="api-keys-chart-tooltip-value">
                                                {d.ApiCalls === 0
                                                    ? c('collider_2025: Info').t`No calls`
                                                    : `${formatAvgTokensPerCall(d.TokensPerCall)} ${c('collider_2025: Unit').t`tokens/call`}`}
                                            </span>
                                        </div>
                                    );
                                }}
                            />
                            <Bar
                                dataKey="TokensPerCall"
                                fill={`url(#${chartUid}-tpc-bar)`}
                                radius={[8, 8, 0, 0]}
                                maxBarSize={18}
                                animationDuration={520}
                                animationEasing="ease-out"
                                isAnimationActive
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export const ApiKeysUsageOverview = ({
    totalTokens,
    totalApiCalls,
    isLoading,
    error,
}: {
    totalTokens: number;
    totalApiCalls: number;
    isLoading: boolean;
    error: boolean;
}) => {
    const avg = totalApiCalls > 0 ? totalTokens / totalApiCalls : 0;

    if (isLoading) {
        return (
            <div className="api-keys-overview api-keys-overview--loading">
                <div className="api-keys-overview__skeleton" />
            </div>
        );
    }

    if (error) {
        return null;
    }

    return (
        <div className="api-keys-overview rounded-lg border border-weak">
            <h3 className="api-keys-overview__title m-0 mb-3">
                {c('collider_2025: Title').t`Usage (all keys, last 30 days)`}
            </h3>
            <div className="api-keys-overview__grid">
                <div className="flex flex-column gap-1">
                    <span className="api-keys-overview__value">{formatTokenCount(totalTokens)}</span>
                    <span className="api-keys-overview__label">{c('collider_2025: Label').t`Tokens generated`}</span>
                </div>
                <div className="flex flex-column gap-1">
                    <span className="api-keys-overview__value">{formatTokenCount(totalApiCalls)}</span>
                    <span className="api-keys-overview__label">{c('collider_2025: Label').t`API calls`}</span>
                </div>
                <div className="flex flex-column gap-1">
                    <span className="api-keys-overview__value">{formatAvgTokensPerCall(avg)}</span>
                    <span className="api-keys-overview__label">{c('collider_2025: Label').t`Avg tokens / call`}</span>
                </div>
            </div>
        </div>
    );
};
