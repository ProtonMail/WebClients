import type { ChartColors } from '../../theme';

export interface DataPoint {
    label: string;
    value: number;
}

export interface AxisTick {
    value: number;
    label?: string | string[];
    major?: boolean;
}

export type FillColor = Extract<keyof ChartColors, 'primary' | 'danger' | 'warning' | 'success' | 'info'>;

interface TrendChartBaseProps {
    /** What the chart is doing. Defaults to view. */
    mode?: 'load' | 'view';
    /** The series to view. */
    data?: DataPoint[];
    /**
     * Handy callback if you want to transform how the Y Axis value is rendered. Given everything chart.js
     * hands its tick callback, so a tick can be written against its neighbours.
     * @example transformYAxisValue: (value) => `%${value}`
     * @example transformYAxisValue: (value, index, ticks) => (index === ticks.length - 1 ? `${value}%` : `${value}`)
     */
    transformYAxisValue?: (value: number, index: number, ticks: AxisTick[]) => string;
    /**
     * Handy callback if you want to transform how the X Axis value is rendered. Given everything chart.js
     * hands its tick callback, so a label can be written against its neighbours.
     * @example transformXAxisValue: (label) => label.toUpperCase()
     * @example transformXAxisValue: (label, index) => (index === 0 ? label : '')
     */
    transformXAxisValue?: (label: string, index: number, ticks: AxisTick[]) => string;
    /**
     * Handy callback if you want to transform what the tooltip shows.
     * @example transformXAxisValue: (label) => label.toUpperCase()
     */
    transformTooltipValue?: (value: number) => string;
    /**
     * Whether the tooltip names the sample it is hovering.
     */
    showTooltipLabel?: boolean;
    /**
     * How thick the line is drawn, in pixels. Defaults to 1.
     */
    borderWidth?: number;
    /**
     * How much the line is smoothed between points, 0 for straight segments. Defaults to a slight curve.
     */
    tension?: number;
    /**
     * What the chart is, for assistive tech. A canvas carries no text, so it is hidden from a screen reader
     * unless a caller names it here; a page that needs a text equivalent tabulates the series itself.
     */
    ariaLabel?: string;
    className?: string;
}

interface TrendChartThresholdProps {
    threshold: number;
    fill?: { above?: FillColor; below?: FillColor };
    thresholdColor?: FillColor;
}

interface TrendChartNoThresholdProps {
    threshold?: never;
    fill?: FillColor;
    thresholdColor?: never;
}

export type TrendChartProps = (TrendChartThresholdProps | TrendChartNoThresholdProps) & TrendChartBaseProps;
