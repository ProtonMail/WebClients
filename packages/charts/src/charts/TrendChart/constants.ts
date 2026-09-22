import type { DataPoint } from './TrendChart.types';

/** How much the line is smoothed between points. */
export const TENSION = 0.1;

/** How thick the line is drawn, in pixels. */
export const BORDER_WIDTH = 1;

/** How opaque the area under the line is painted. */
export const FILL_ALPHA = 0.16;

/**
 * How the series arrives into view, animated.
 */
export const ARRIVAL = {
    duration: 1000,
    easing: 'easeOutQuart',
} as const;

/**
 * Values for the chart to stay in place when toggling between load and view
 * plus some values for chart structure.
 */
export const AXIS = {
    /** Room for the value axis, left of the plot. */
    yWidth: 46,
    /** Room for the label axis, below the plot. */
    xHeight: 28,
    /** Room above the plot, for the topmost value label to sit centred on it. */
    topOverhang: 10,
    /** Room right of the plot, for the last label to sit centred on it. */
    rightOverhang: 12,
} as const;

export const SKELETON_SERIES: DataPoint[] = [32, 76, 28, 54, 35, 88, 41].map((value) => ({
    label: '',
    value,
}));

export const NO_LABEL = '';
