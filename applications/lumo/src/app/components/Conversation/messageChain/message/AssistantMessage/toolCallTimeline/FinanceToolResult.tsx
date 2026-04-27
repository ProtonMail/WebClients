import { useEffect, useMemo } from 'react';

import {
    Area,
    Bar,
    CartesianGrid,
    ComposedChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import { c } from 'ttag';

import './FinanceToolResult.scss';

interface MonthlyPoint {
    date: string;
    price: number;
    volume: number;
}

interface CompanyInfo {
    name: string;
    description?: string;
    exchange?: string;
    industry?: string;
    sector?: string;
    market_cap?: number;
    pe_ratio?: number;
    profit_margin?: number;
    dividend_yield?: number;
    revenue_ttm?: number;
}

export interface FinanceData {
    type: 'Stock' | 'Cryptocurrency' | string;
    current_price: number;
    monthly_trend: MonthlyPoint[];
    company_info?: CompanyInfo;
}

export const formatCurrency = (value: number): string => {
    if (value >= 1_000_000_000_000) {
        return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
    }
    if (value >= 1_000_000_000) {
        return `$${(value / 1_000_000_000).toFixed(2)}B`;
    }
    if (value >= 1_000_000) {
        return `$${(value / 1_000_000).toFixed(2)}M`;
    }
    return `$${value.toLocaleString()}`;
};

const formatVolume = (value: number): string => {
    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
        return `${(value / 1_000).toFixed(0)}K`;
    }
    return `${value}`;
};

export const formatPercent = (value: number): string => {
    return `${(value * 100).toFixed(2)}%`;
};

export const formatPrice = (value: number): string => {
    if (value >= 1000) {
        return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${value.toFixed(2)}`;
};

export const formatShortDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatLastUpdated = (dateStr: string): string => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

interface CustomTooltipProps {
    active?: boolean;
    payload?: { value: number; name: string; dataKey: string }[];
    label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (!active || !payload || payload.length === 0) return null;

    const priceEntry = payload.find((p) => p.dataKey === 'price');
    const volumeEntry = payload.find((p) => p.dataKey === 'volume');

    return (
        <div className="finance-chart-tooltip">
            <p className="finance-chart-tooltip__date">{label}</p>
            {priceEntry && <p className="finance-chart-tooltip__price">{formatPrice(priceEntry.value)}</p>}
            {volumeEntry && (
                <p className="finance-chart-tooltip__volume">Vol: {formatVolume(volumeEntry.value)}</p>
            )}
        </div>
    );
};

interface StatCardProps {
    label: string;
    value: string;
}

const StatCard = ({ label, value }: StatCardProps) => (
    <div className="finance-card__stat py-2 px-4">
        <p className="finance-card__stat-label m-0">{label}</p>
        <p className="finance-card__stat-value m-0">{value}</p>
    </div>
);

interface FinanceToolResultProps {
    data: FinanceData;
    onReady?: () => void;
}

export const FinanceToolResult = ({ data, onReady }: FinanceToolResultProps) => {
    useEffect(() => {
        if (!onReady) return;

        let paintFrame = 0;
        const layoutFrame = requestAnimationFrame(() => {
            paintFrame = requestAnimationFrame(onReady);
        });

        return () => {
            cancelAnimationFrame(layoutFrame);
            cancelAnimationFrame(paintFrame);
        };
    }, [onReady]);

    const chartData = useMemo(
        () =>
            [...data.monthly_trend].reverse().map((point) => ({
                dateLabel: formatShortDate(point.date),
                price: point.price,
                volume: point.volume,
            })),
        [data.monthly_trend]
    );

    // Day-over-day change drives the price badge colour
    const previousClose = data.monthly_trend[1]?.price ?? data.monthly_trend[0]?.price;
    const priceChange = data.current_price - previousClose;
    const priceChangePct = (priceChange / previousClose) * 100;
    const isUp = priceChange >= 0;

    // 30-day trend drives the chart line/gradient colour
    const oldestPrice = chartData[0]?.price ?? data.current_price;
    const isTrendUp = data.current_price >= oldestPrice;

    const priceMin = Math.min(...chartData.map((d) => d.price));
    const priceMax = Math.max(...chartData.map((d) => d.price));
    const pricePadding = (priceMax - priceMin) * 0.1;

    const maxVolume = Math.max(...chartData.map((d) => d.volume));

    const lastDate = data.monthly_trend[0]?.date;
    const info = data.company_info;

    const stats: { label: string; value: string }[] = [];
    if (info?.market_cap) {
        stats.push({ label: c('collider_2025:Finance').t`Market Cap`, value: formatCurrency(info.market_cap) });
    }
    if (info?.pe_ratio) {
        stats.push({ label: c('collider_2025:Finance').t`P/E Ratio`, value: info.pe_ratio.toFixed(2) });
    }
    if (info?.revenue_ttm) {
        stats.push({ label: c('collider_2025:Finance').t`Revenue (TTM)`, value: formatCurrency(info.revenue_ttm) });
    }
    if (info?.profit_margin) {
        stats.push({ label: c('collider_2025:Finance').t`Profit Margin`, value: formatPercent(info.profit_margin) });
    }
    if (info?.dividend_yield) {
        stats.push({ label: c('collider_2025:Finance').t`Dividend Yield`, value: formatPercent(info.dividend_yield) });
    }
    if (info?.exchange) {
        stats.push({ label: c('collider_2025:Finance').t`Exchange`, value: info.exchange });
    }

    const priceYDomain: [number, number] = [priceMin - pricePadding, priceMax + pricePadding];
    const volumeYDomain: [number, number] = [0, maxVolume * 5];

    return (
        <div className="finance-card mb-2">
            <div className="flex items-center justify-space-between gap-2 py-3 px-4">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                        className={`finance-card__trend-icon finance-card__trend-icon--${isUp ? 'up' : 'down'}`}
                        aria-hidden="true"
                    >
                        {isUp ? '↗' : '↘'}
                    </span>
                    <span className="finance-card__company-name">{info?.name ?? data.type}</span>
                    {info?.exchange && (
                        <span className="finance-card__type-badge py-0.5 px-1.5 rounded-sm">{info.exchange}</span>
                    )}
                </div>
                {lastDate && (
                    <span className="finance-card__last-updated shrink-0">
                        {c('collider_2025:Reasoning').t`Last updated: ` + formatLastUpdated(lastDate)}
                    </span>
                )}
            </div>

            <div className="flex items-baseline gap-2 flex-wrap pt-1 pb-3 px-4">
                <span className="finance-card__price">{formatPrice(data.current_price)}</span>
                <span className={`finance-card__change finance-card__change--${isUp ? 'up' : 'down'}`}>
                    {isUp ? '+' : ''}
                    {priceChange.toFixed(2)} ({isUp ? '+' : ''}
                    {priceChangePct.toFixed(2)}%)
                </span>
            </div>

            <div className="finance-card__chart">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                        <defs>
                            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor={isTrendUp ? 'var(--signal-success)' : 'var(--signal-danger)'}
                                    stopOpacity={0.2}
                                />
                                <stop
                                    offset="95%"
                                    stopColor={isTrendUp ? 'var(--signal-success)' : 'var(--signal-danger)'}
                                    stopOpacity={0}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--border-weak)"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="dateLabel"
                            tick={{ fontSize: 10, fill: 'var(--text-weak)' }}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            yAxisId="price"
                            domain={priceYDomain}
                            tick={{ fontSize: 10, fill: 'var(--text-weak)' }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v: number) => `$${v.toFixed(0)}`}
                            width={45}
                        />
                        <YAxis yAxisId="volume" domain={volumeYDomain} hide />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-norm)', strokeWidth: 1 }} />
                        <Bar
                            yAxisId="volume"
                            dataKey="volume"
                            fill="var(--text-weak)"
                            opacity={0.2}
                            radius={[2, 2, 0, 0]}
                            isAnimationActive={false}
                        />
                        <Area
                            yAxisId="price"
                            type="monotone"
                            dataKey="price"
                            stroke={isTrendUp ? 'var(--signal-success)' : 'var(--signal-danger)'}
                            strokeWidth={2}
                            fill="url(#priceGradient)"
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 0 }}
                            isAnimationActive={false}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {stats.length > 0 && (
                <div className="finance-card__stats">
                    {stats.map((stat) => (
                        <StatCard key={stat.label} label={stat.label} value={stat.value} />
                    ))}
                </div>
            )}
        </div>
    );
};

export const parseFinanceResult = (result: string): FinanceData | null => {
    try {
        const parsed = JSON.parse(result);
        if (
            typeof parsed.current_price === 'number' &&
            Array.isArray(parsed.monthly_trend) &&
            parsed.monthly_trend.length > 0
        ) {
            return parsed as FinanceData;
        }
    } catch {
        // Not valid JSON or not finance format
    }
    return null;
};
