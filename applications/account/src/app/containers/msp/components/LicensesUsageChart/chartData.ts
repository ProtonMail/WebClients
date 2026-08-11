import { getFormattedMonths } from '@proton/shared/lib/date/date';

import type { SeatDay } from '../../types';

const MONTH_SHORT = getFormattedMonths('MMM');

export interface ChartItem {
    date: string;
    seats: number;
    avg: number | null;
}

export interface ChartData {
    chartData: ChartItem[];
    yDomain: [number, number];
    yTicks: number[];
    lastDot: ChartItem | undefined;
}

function formatLabel(dateStr: string): string {
    const [, m, d] = dateStr.split('-');
    return `${MONTH_SHORT[parseInt(m, 10) - 1]} ${parseInt(d, 10)}`;
}

function niceStep(raw: number): number {
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / mag;
    if (n <= 1) {
        return mag;
    }
    if (n <= 2) {
        return 2 * mag;
    }
    if (n <= 2.5) {
        return 2.5 * mag;
    }
    if (n <= 5) {
        return 5 * mag;
    }
    return 10 * mag;
}

function computeYAxis(maxVal: number): { domain: [number, number]; ticks: number[] } {
    const ceiling = maxVal * 1.2;
    const step = niceStep(ceiling / 5);
    const max = Math.ceil(ceiling / step) * step;
    const ticks: number[] = [];
    for (let v = 0; v <= max; v += step) {
        ticks.push(v);
    }
    return { domain: [0, max], ticks };
}

export function computeChartData(data: SeatDay[]): ChartData {
    const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));

    let lastDataIdx = sorted.length - 1;
    while (lastDataIdx > 0 && sorted[lastDataIdx].seats === 0) {
        lastDataIdx--;
    }

    const maxVal = Math.max(...sorted.map((d) => d.seats), 1);
    const { domain, ticks } = computeYAxis(maxVal);

    let sum = 0;
    const chartData = sorted.map((day, i) => {
        if (i <= lastDataIdx) {
            sum += day.seats;
            return { date: formatLabel(day.date), seats: day.seats, avg: sum / (i + 1) };
        }
        return { date: formatLabel(day.date), seats: day.seats, avg: null };
    });

    return {
        chartData,
        yDomain: domain,
        yTicks: ticks,
        lastDot: chartData[lastDataIdx],
    };
}
