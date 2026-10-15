import type { ChartData } from './deck';

/** Chart rules shared by the .pptx writer and the canvas preview, so both draw the same chart. */

/**
 * Values are labelled directly while a chart has at most this many points; beyond that, a label on
 * every point is clutter ("never a number on every point"), so the value axis
 * and gridlines come back instead. The threshold is a judgement call.
 */
export const MAX_LABELLED_POINTS = 12;

export const isChartLabelled = (chart: ChartData): boolean => {
    return chart.kind === 'pie' || chart.categories.length * chart.series.length <= MAX_LABELLED_POINTS;
};

/** Decimals the data itself uses, up to 2, so labels neither round values nor pad them. */
export const chartDecimals = (chart: ChartData): number => {
    const decimals = chart.series.flatMap((series) => {
        return series.values.map((value) => {
            return (String(value).split('.')[1] ?? '').length;
        });
    });
    return Math.min(2, Math.max(0, ...decimals));
};

/** A value as the chart labels show it: thousands separators, the data's decimals, "%" when that's the unit. */
export const formatChartValue = (value: number, chart: ChartData): string => {
    const decimals = chartDecimals(chart);
    const text = value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return chart.unit === '%' ? `${text}%` : text;
};
