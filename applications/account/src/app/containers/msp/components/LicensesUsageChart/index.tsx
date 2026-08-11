import { useMemo, useState } from 'react';

import {
    Bar,
    CartesianGrid,
    Cell,
    ComposedChart,
    Line,
    ReferenceDot,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { c } from 'ttag';

import type { SeatDay } from '../../types';
import { computeChartData } from './chartData';

import './LicensesUsageChart.scss';

interface TooltipContentProps {
    active?: boolean;
    payload?: { name: string; value: number }[];
    label?: string;
}

const TooltipContent = ({ active, payload, label }: TooltipContentProps) => {
    if (!active || !payload?.length) {
        return null;
    }
    const seats = payload.find((p) => p.name === 'seats')?.value ?? 0;
    const avg = payload.find((p) => p.name === 'avg')?.value;
    return (
        <div className="msp-chart-tooltip-inner flex flex-column gap-1">
            <p className="m-0 text-semibold text-sm">{label}</p>
            <div className="flex justify-space-between gap-4">
                <span className="text-sm color-weak">{c('Label').t`Peak allocated licenses`}</span>
                <span className="text-sm text-semibold">{seats}</span>
            </div>
            {avg != null && (
                <div className="flex justify-space-between gap-4">
                    <span className="text-sm color-weak">{c('Label').t`Monthly average`}</span>
                    <span className="text-sm text-semibold">{avg.toPrecision(2)}</span>
                </div>
            )}
        </div>
    );
};

const LicensesUsageChart = ({ data }: { data: SeatDay[] }) => {
    const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);

    const { chartData, yDomain, yTicks, lastDot } = useMemo(() => computeChartData(data), [data]);

    return (
        <div className="flex flex-column gap-10">
            <div className="flex items-center justify-space-between">
                <p className="m-0 text-semibold">{c('Label').t`Licenses usage`}</p>
                <div className="flex gap-4 items-center">
                    <div className="flex gap-2 items-center">
                        <div className="msp-chart-legend-bar" />
                        <span className="text-sm">{c('Label').t`Peak allocated licenses`}</span>
                    </div>
                    <div className="flex gap-2 items-center">
                        <div className="msp-chart-legend-line" />
                        <span className="text-sm">{c('Label').t`Monthly average`}</span>
                    </div>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={228}>
                <ComposedChart data={chartData} margin={{ top: 4, right: 24, bottom: 0, left: 0 }} barCategoryGap="20%">
                    <CartesianGrid stroke="var(--border-weak)" strokeWidth={1} vertical={false} />
                    <XAxis
                        dataKey="date"
                        interval={4}
                        tick={{ fontSize: 12, fill: 'var(--text-weak)' }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        domain={yDomain}
                        ticks={yTicks}
                        tick={{ fontSize: 12, fill: 'var(--text-weak)' }}
                        tickLine={false}
                        axisLine={false}
                        width={48}
                    />
                    <Tooltip
                        content={<TooltipContent />}
                        cursor={false}
                        wrapperStyle={{ background: 'none', border: 'none', padding: 0, boxShadow: 'none' }}
                    />
                    <Bar
                        dataKey="seats"
                        activeBar={false}
                        radius={[4, 4, 0, 0]}
                        animationDuration={600}
                        onMouseEnter={(_, index) => setActiveBarIndex(index)}
                        onMouseLeave={() => setActiveBarIndex(null)}
                    >
                        {chartData.map((_, index) => (
                            <Cell
                                key={index}
                                fill={index === activeBarIndex ? 'var(--signal-info)' : 'var(--signal-info-minor-1)'}
                            />
                        ))}
                    </Bar>
                    <Line
                        dataKey="avg"
                        stroke="var(--primary)"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 5, fill: 'var(--primary)', strokeWidth: 0 }}
                        connectNulls={false}
                        animationBegin={400}
                        animationDuration={600}
                    />
                    {lastDot && (
                        <ReferenceDot
                            x={lastDot.date}
                            y={lastDot.avg ?? undefined}
                            r={5}
                            fill="var(--primary)"
                            stroke="var(--signal-info-minor-1)"
                            strokeWidth={2}
                            strokeOpacity={0.5}
                        />
                    )}
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default LicensesUsageChart;
