import type { FillColor } from '../../theme';

export type { FillColor };

export interface BarDataPoint {
    /** What this row is called, written beside its bar. */
    label: string;
    /** What this row reads. Bar length is worked out from it against the chart's range. */
    value: number;
    /**
     * What this row alone means, where it differs from the rest of the series — the one gateway
     * over its limit, say. Falls back to the chart's `fill`.
     */
    fill?: FillColor;
}

export interface HorizontalBarChartProps {
    /**
     * Whether the chart is showing readings or waiting for them. In `load` it draws a skeleton
     * under a shimmer, at the same geometry, so nothing shifts when the real rows arrive.
     * Defaults to `view`.
     */
    mode?: 'load' | 'view';
    /** The rows to compare, drawn top to bottom in the order given. */
    data?: BarDataPoint[];
    /**
     * What the bars are measured against, handed to chart.js as given. `max` must be above `min`:
     * chart.js maps a reading by dividing by the span between them, so ends that meet paint
     * nothing and ends the wrong way round draw the bars backwards, neither with a word of
     * complaint.
     *
     * Left out, the span runs between the smallest and largest readings in `data`, so the largest
     * fills the plot and the smallest sits at the axis with no bar. That suits a set whose spread
     * is the point. Pass a range wherever the scale means something — a quota, a capacity, a
     * hundred per cent — or wherever a row with no bar would read as broken.
     * @example valueRange={{ min: 0, max: 100 }}
     */
    valueRange?: {
        /** The reading the start of a bar stands for. */
        min: number;
        /** The reading the end of the plot stands for. */
        max: number;
    };
    /**
     * What the series means. Named rather than coloured: the active theme decides what it looks
     * like. A row can override it with its own `fill`. Defaults to `primary`.
     */
    fill?: FillColor;
    /**
     * How many lines are drawn down the plot, counting the ends. Defaults to 5, so the quarters
     * of the span. Two draws the ends alone, and anything below that draws none.
     */
    gridLines?: number;
    /**
     * Writes the reading that sits past the end of each bar. The plot keeps room for the widest
     * one it returns, so a longer format moves the bars rather than being clipped.
     * @example transformValueLabel={(value) => `${value}%`}
     */
    transformValueLabel?: (value: number, index: number) => string;
    /**
     * Writes the name beside each row. The names take the width they need and push the plot
     * across, so this is where a long one is shortened.
     * @example transformCategoryValue={(label) => label.replace('-VPN', '')}
     */
    transformCategoryValue?: (label: string, index: number) => string;
    /**
     * Writes the reading the tooltip shows, which can differ from the one on the bar.
     * @example transformTooltipValue={(value) => `${value} connections`}
     */
    transformTooltipValue?: (value: number) => string;
    /**
     * Whether the tooltip names the row it is reading. Defaults to true, and worth keeping
     * wherever a name has been shortened: the tooltip is then the only place it is readable in
     * full.
     */
    showTooltipLabel?: boolean;
    /**
     * What the chart is, for assistive tech. A canvas carries no text, so it is hidden from a
     * screen reader unless named here; a page that needs a text equivalent tabulates the rows
     * itself.
     */
    ariaLabel?: string;
    className?: string;
}
