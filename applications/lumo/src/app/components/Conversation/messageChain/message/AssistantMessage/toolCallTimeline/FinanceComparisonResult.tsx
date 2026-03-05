import { useMemo } from 'react';

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

import type { FinanceData } from './FinanceToolResult';
import { formatCurrency, formatPercent, formatPrice, formatShortDate } from './FinanceToolResult';
import './FinanceComparisonResult.scss';

export interface FinanceComparisonItem {
    data: FinanceData;
    symbol: string;
}

const LINE_COLORS = ['#6d4aff', '#1ea885', '#239ece', '#ff9900', '#dc3251', '#4c34b3'];

const STAT_ROWS: { label: string; getValue: (d: FinanceData) => string }[] = [
    { label: 'Price', getValue: (d) => formatPrice(d.current_price) },
    {
        label: 'Market Cap',
        getValue: (d) => (d.company_info?.market_cap ? formatCurrency(d.company_info.market_cap) : '—'),
    },
    {
        label: 'P/E Ratio',
        getValue: (d) => (d.company_info?.pe_ratio != null ? d.company_info.pe_ratio.toFixed(2) : '—'),
    },
    {
        label: 'Profit Margin',
        getValue: (d) => (d.company_info?.profit_margin != null ? formatPercent(d.company_info.profit_margin) : '—'),
    },
    {
        label: 'Revenue TTM',
        getValue: (d) => (d.company_info?.revenue_ttm ? formatCurrency(d.company_info.revenue_ttm) : '—'),
    },
    {
        label: 'Dividend Yield',
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
        <div className="finance-comparison__tooltip">
            <p className="finance-comparison__tooltip-date">{label}</p>
            {payload.map((entry, i) => {
                const idx = Number(entry.dataKey.replace('pct_', ''));
                const symbol = items[idx]?.symbol ?? `#${idx + 1}`;
                const sign = entry.value >= 0 ? '+' : '';
                return (
                    <p key={i} className="finance-comparison__tooltip-row" style={{ color: entry.color }}>
                        {symbol}: {sign}
                        {entry.value.toFixed(2)}%
                    </p>
                );
            })}
        </div>
    );
};

export const FinanceComparisonResult = ({ items }: { items: FinanceComparisonItem[] }) => {
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
            <div className="finance-comparison__header">
                <span className="finance-comparison__title">Performance comparison · 30 days</span>
                <div className="finance-comparison__legend">
                    {items.map((item, i) => (
                        <span key={i} className="finance-comparison__legend-item">
                            <span
                                className="finance-comparison__legend-dot"
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
                            className="finance-comparison__price-card"
                            style={{ borderTopColor: LINE_COLORS[i % LINE_COLORS.length] }}
                        >
                            <p className="finance-comparison__price-symbol">{item.symbol}</p>
                            <p className="finance-comparison__price-name">
                                {item.data.company_info?.name ?? item.data.type}
                            </p>
                            <p className="finance-comparison__price-value">
                                {formatPrice(item.data.current_price)}
                            </p>
                            <p
                                className={`finance-comparison__price-change finance-comparison__price-change--${isUp ? 'up' : 'down'}`}
                            >
                                {isUp ? '+' : ''}
                                {change.toFixed(2)} ({isUp ? '+' : ''}
                                {changePct.toFixed(2)}%)
                            </p>
                        </div>
                    );
                })}
            </div>

            <table className="finance-comparison__table">
                <thead>
                    <tr>
                        <th className="finance-comparison__table-header-label" />
                        {items.map((item, i) => (
                            <th
                                key={i}
                                className="finance-comparison__table-header-symbol"
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
                            <td className="finance-comparison__table-label">{row.label}</td>
                            {items.map((item, i) => (
                                <td key={i} className="finance-comparison__table-value">
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
