import type { FillColor } from '../../theme';

export type { FillColor };

export interface DataPoint {
    label: string;
    /** A missed reading is `null`: the line carries across it rather than dropping to zero. */
    value: number | null;
}

export interface AxisTick {
    value: number;
    label?: string | string[];
    major?: boolean;
}

interface TrendChartBaseProps {
    /** What the chart is doing. Defaults to view. */
    mode?: 'load' | 'view';
    /** The series to view. */
    data?: DataPoint[];
    /**
     * Whether the line is carried across a missed reading, or the most consecutive missed readings
     * it is carried across before it breaks instead. Defaults to true, carrying across any gap.
     *
     * A number draws the distinction the two booleans cannot: a reading or two lost to a blip is
     * carried across, while an outage long enough to be its own event breaks the line rather than
     * inventing a trend over it.
     * @example bridgeMissedReadings={false}
     * @example bridgeMissedReadings={2}
     */
    bridgeMissedReadings?: boolean | number;
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
    /** Whether a dot marks the latest reading, saying where the readings stop. Off by default. */
    showLatestPoint?: boolean;
    /**
     * The two ends are handed to chart.js as they are given. `max` must be above `min`: chart.js
     * maps a reading by dividing by the span between them, so ends that meet paint nothing and
     * ends the wrong way round draw the axis upside down, neither with a word of complaint.
     * @example valueRange={{ min: 0, max: 100 }}
     */
    valueRange?: {
        /** The reading the floor of the plot stands for. */
        min: number;
        /** The reading the ceiling of the plot stands for. */
        max: number;
    };
    /**
     * The readings the value axis writes, in place of chart.js's own. Outside `valueRange` are dropped.
     * @example valueTicks={[0, 50, 100]}
     */
    valueTicks?: number[];
    /** Whether the readings are whole numbers, so the axis must not step in fractions of one. */
    wholeValues?: boolean;
    /**
     * Whether each `valueTicks` reading is carried across the plot as a faint dashed rule.
     * Needs `valueTicks`: chart.js's own marks are not known when these options are built.
     */
    showValueGuides?: boolean;
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
    /**
     * Whether the threshold's own reading is written on the value axis, in the rule's colour.
     * Defaults to true.
     *
     * Turn it off where the rule speaks for itself and the number beside it is noise — a grid of
     * small cards all ruled at the same limit, say, where reading it once above the grid says
     * more than reading it on every card. The rule, the colour the line changes at it and the
     * tooltip are all unaffected; only the axis goes quiet.
     */
    showThresholdLabel?: boolean;
}

interface TrendChartNoThresholdProps {
    threshold?: never;
    fill?: FillColor;
    thresholdColor?: never;
    showThresholdLabel?: never;
}

export type TrendChartProps = (TrendChartThresholdProps | TrendChartNoThresholdProps) & TrendChartBaseProps;
