import type { ChartData } from './deck';

/** Chart rules shared by the .pptx writer and the canvas preview, so both draw the same chart. */

/**
 * Values are labelled directly while a chart has at most this many points; beyond that, a label on
 * every point is clutter ("never a number on every point"), so the value axis
 * and gridlines come back instead. The threshold is a judgement call.
 */
const MAX_LABELLED_POINTS = 12;

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

/**
 * Round axis bounds a little beyond the data, like an office app's automatic axis. Zero is always
 * on the axis, so bars grow from it: up for positive values, down for negative ones.
 */
export const niceAxis = (values: number[]): { min: number; max: number } => {
    const dataMax = Math.max(0, ...values);
    const dataMin = Math.min(0, ...values);
    if (dataMax === dataMin) {
        return { min: 0, max: 1 };
    }
    const rough = (dataMax - dataMin) / 5;
    const magnitude = 10 ** Math.floor(Math.log10(rough));
    const step = [1, 2, 5, 10]
        .map((factor) => {
            return factor * magnitude;
        })
        .find((candidate) => {
            return candidate >= rough;
        })!;
    const max = dataMax > 0 ? Math.ceil(dataMax / step) * step + (dataMax % step === 0 ? step : 0) : 0;
    const min = dataMin < 0 ? Math.floor(dataMin / step) * step - (dataMin % step === 0 ? step : 0) : 0;
    return { min, max };
};
