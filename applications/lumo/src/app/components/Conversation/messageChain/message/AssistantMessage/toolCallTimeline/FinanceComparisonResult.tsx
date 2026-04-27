import { useEffect, useMemo } from 'react';

import {
    CartesianGrid,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { c } from 'ttag';

import type { FinanceData } from './FinanceToolResult';
import { formatCurrency, formatPercent, formatPrice, formatShortDate } from './FinanceToolResult';
import './FinanceComparisonResult.scss';

export interface FinanceComparisonItem {
    data: FinanceData;
    symbol: string;
}

const LINE_COLORS = ['#6d4aff', '#1ea885', '#239ece', '#ff9900', '#dc3251', '#4c34b3'];

const STAT_ROWS: { label: string; getValue: (d: FinanceData) => string }[] = [
    { label: c('collider_2025:Reasoning').t`Price`, getValue: (d) => formatPrice(d.current_price) },
    {
        label: c('collider_2025:Reasoning').t`Market Cap`,
        getValue: (d) => (d.company_info?.market_cap ? formatCurrency(d.company_info.market_cap) : '—'),
    },
    {
        label: c('collider_2025:Reasoning').t`P/E Ratio`,
        getValue: (d) => (d.company_info?.pe_ratio != null ? d.company_info.pe_ratio.toFixed(2) : '—'),
    },
    {
        label: c('collider_2025:Reasoning').t`Profit Margin`,
        getValue: (d) => (d.company_info?.profit_margin != null ? formatPercent(d.company_info.profit_margin) : '—'),
    },
    {
        label: c('collider_2025:Reasoning').t`Revenue TTM`,
        getValue: (d) => (d.company_info?.revenue_ttm ? formatCurrency(d.company_info.revenue_ttm) : '—'),
    },
    {
        label: c('collider_2025:Reasoning').t`Dividend Yield`,
        getValue: (d) =>
            d.company_info?.dividend_yield != null ? formatPercent(d.company_info.dividend_yield) : '—',
    },
];

interface TooltipProps {
    active?: boolean;
    payload?: { value: number; dataKey: string; color: string }[];
    label?: string;
    items: FinanceComparisonItem[];
}

const ComparisonTooltip = ({ active, payload, label, items }: TooltipProps) => {
    if (!active || !payload || payload.length === 0) return null;
    return (
        <div className="finance-comparison__tooltip py-2 px-3 rounded">
            <p className="finance-comparison__tooltip-date m-0 mb-1">{label}</p>
            {payload.map((entry, i) => {
                const idx = Number(entry.dataKey.replace('pct_', ''));
                const symbol = items[idx]?.symbol ?? `#${idx + 1}`;
                const sign = entry.value >= 0 ? '+' : '';
                return (
                    <p key={i} className="finance-comparison__tooltip-row m-0 text-semibold" style={{ color: entry.color }}>
                        {symbol}: {sign}
                        {entry.value.toFixed(2)}%
                    </p>
                );
            })}
        </div>
    );
};

interface FinanceComparisonResultProps {
    items: FinanceComparisonItem[];
    onReady?: () => void;
}

export const FinanceComparisonResult = ({ items, onReady }: FinanceComparisonResultProps) => {
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

    const chartData = useMemo(() => {
        const series = items.map((item) => {
            const sorted = [...item.data.monthly_trend].reverse();
            const firstPrice = sorted[0]?.price ?? 1;
            return sorted.map((point) => ({
                dateLabel: formatShortDate(point.date),
                pct: ((point.price - firstPrice) / firstPrice) * 100,
            }));
        });

        const length = Math.min(...series.map((s) => s.length));
        return Array.from({ length }, (_, i) => {
            const entry: Record<string, string | number> = { dateLabel: series[0][i].dateLabel };
            series.forEach((s, si) => {
                entry[`pct_${si}`] = parseFloat(s[i].pct.toFixed(3));
            });
            return entry;
        });
    }, [items]);

    return (
        <div className="finance-comparison mb-2">
            <div className="flex items-center justify-space-between flex-wrap gap-3 py-3 px-4">
                <span className="finance-comparison__title">{c('collider_2025:Reasoning').t`Performance comparison`}</span>
                <div className="flex items-center gap-4">
                    {items.map((item, i) => (
                        <span key={i} className="finance-comparison__legend-item flex items-center gap-1.5">
                            <span
                                className="finance-comparison__legend-dot shrink-0"
                                style={{ background: LINE_COLORS[i % LINE_COLORS.length] }}
                            />
                            {item.symbol}
                        </span>
                    ))}
                </div>
            </div>

            <div className="finance-comparison__chart">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-weak)" vertical={false} />
                        <ReferenceLine yAxisId="pct" y={0} stroke="var(--border-norm)" strokeWidth={1} />
                        <XAxis
                            dataKey="dateLabel"
                            tick={{ fontSize: 10, fill: 'var(--text-weak)' }}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            yAxisId="pct"
                            tick={{ fontSize: 10, fill: 'var(--text-weak)' }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`}
                            width={48}
                        />
                        <Tooltip
                            content={<ComparisonTooltip items={items} />}
                            cursor={{ stroke: 'var(--border-norm)', strokeWidth: 1 }}
                        />
                        {items.map((_, i) => (
                            <Line
                                key={i}
                                yAxisId="pct"
                                type="monotone"
                                dataKey={`pct_${i}`}
                                stroke={LINE_COLORS[i % LINE_COLORS.length]}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, strokeWidth: 0 }}
                                isAnimationActive={false}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="finance-comparison__prices">
                {items.map((item, i) => {
                    const prev = item.data.monthly_trend[1]?.price ?? item.data.monthly_trend[0]?.price;
                    const change = item.data.current_price - prev;
                    const changePct = (change / prev) * 100;
                    const isUp = change >= 0;
                    return (
                        <div
                            key={i}
                            className="finance-comparison__price-card py-3 px-4"
                            style={{ borderTopColor: LINE_COLORS[i % LINE_COLORS.length] }}
                        >
                            <p className="finance-comparison__price-symbol m-0">{item.symbol}</p>
                            <p className="finance-comparison__price-name m-0 mb-1.5">
                                {item.data.company_info?.name ?? item.data.type}
                            </p>
                            <p className="finance-comparison__price-value m-0">
                                {formatPrice(item.data.current_price)}
                            </p>
                            <p
                                className={`finance-comparison__price-change finance-comparison__price-change--${isUp ? 'up' : 'down'} m-0`}
                            >
                                {isUp ? '+' : ''}
                                {change.toFixed(2)} ({isUp ? '+' : ''}
                                {changePct.toFixed(2)}%)
                            </p>
                        </div>
                    );
                })}
            </div>

            <table className="finance-comparison__table w-full">
                <thead>
                    <tr>
                        <th className="py-2 px-4 text-left" />
                        {items.map((item, i) => (
                            <th
                                scope="col"
                                key={i}
                                className="finance-comparison__table-header-symbol py-2 px-4 text-right"
                                style={{ color: LINE_COLORS[i % LINE_COLORS.length] }}
                            >
                                {item.symbol}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {STAT_ROWS.filter((row) => items.some((item) => row.getValue(item.data) !== '—')).map((row) => (
                        <tr key={row.label} className="finance-comparison__table-row">
                            <td className="finance-comparison__table-label py-2 px-4">{row.label}</td>
                            {items.map((item, i) => (
                                <td key={i} className="finance-comparison__table-value py-2 px-4 text-right">
                                    {row.getValue(item.data)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
