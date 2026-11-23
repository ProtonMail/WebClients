import type { CartesianScaleOptions, Chart, ChartType, FontSpec, Plugin } from 'chart.js';
import { toFont } from 'chart.js/helpers';

import clamp from '@proton/utils/clamp';

export const BAR_CHART_VALUE_LABELS_PLUGIN_ID = 'protonBarChartValueLabels';

export interface BarChartValueLabelsOptions {
    /** Whether readings are drawn at all. Off by default, since every chart is handed every plugin. */
    enabled?: boolean;
    /** One already formatted reading per bar, in dataset order. An empty entry leaves that bar bare. */
    readings?: string[];
    /** Colour the readings are written in. */
    textColor: string;
    /** Space between the end of a bar and its reading, in pixels. */
    gapFromBar?: number;
    /** Fraction of its final length, from 0 to 1, a bar has to reach before its reading fades in. */
    fadeInFrom?: number;
    /** Font the readings are written in. Defaults to the chart's own. */
    font?: Partial<FontSpec>;
}

declare module 'chart.js' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- the parameter has to match chart.js's own
    interface PluginOptionsByType<TType extends ChartType> {
        [BAR_CHART_VALUE_LABELS_PLUGIN_ID]?: BarChartValueLabelsOptions;
    }
}

const DEFAULT_GAP_FROM_BAR = 8;
const DEFAULT_FADE_IN_FROM = 0.85;
const CHART_JS_TICKS_PADDING = 3;

/** chart.js lets a chart set its padding as one number, four sides, or a point; only four sides can be spread. */
const isPaddingBySide = (padding: unknown): padding is Record<string, number> =>
    typeof padding === 'object' && padding !== null && !Array.isArray(padding);

/**
 * How much of its final length a bar has grown.
 *
 * @param currentX - Where the bar's growing end sits in the frame being drawn, in canvas pixels.
 * @param finalX - Where that same end comes to rest once the bar has finished growing, in canvas pixels.
 * @param baseX - Where the bar starts from, in canvas pixels.
 * @returns A fraction from 0 to 1. A bar under a pixel long counts as fully grown, since dividing by
 * a span that small turns rounding differences into enormous fractions.
 */
const fractionGrown = (currentX: number, finalX: number, baseX: number) => {
    const spanInPixels = finalX - baseX;

    if (Math.abs(spanInPixels) < 1) {
        return 1;
    }

    return (currentX - baseX) / spanInPixels;
};

const hasReadingsBelowZero = (chart: Chart<'bar'>) =>
    (chart.data.datasets[0]?.data ?? []).some((reading) => typeof reading === 'number' && reading < 0);

/** The width in pixels of the longest reading, measured in the font it will be written in. */
const widestReadingWidth = (ctx: CanvasRenderingContext2D, readings: string[], font: string) => {
    ctx.save();
    ctx.font = font;

    const widest = readings.reduce((widthSoFar, reading) => Math.max(widthSoFar, ctx.measureText(reading).width), 0);

    ctx.restore();

    return widest;
};

export const barChartValueLabelsPlugin: Plugin<'bar'> = {
    id: BAR_CHART_VALUE_LABELS_PLUGIN_ID,

    beforeLayout: (chart, _args, { enabled, readings = [], gapFromBar = DEFAULT_GAP_FROM_BAR, font }) => {
        if (enabled !== true) {
            return;
        }

        const layout = chart.options.layout ?? {};
        const padding = isPaddingBySide(layout.padding) ? layout.padding : {};
        const roomForReadings = widestReadingWidth(chart.ctx, readings, toFont(font).string) + gapFromBar;

        chart.options.layout = { ...layout, padding: { ...padding, right: roomForReadings } };

        const categoryAxis = chart.scales.y?.options as CartesianScaleOptions | undefined;

        if (categoryAxis === undefined) {
            return;
        }

        categoryAxis.ticks.padding = hasReadingsBelowZero(chart)
            ? CHART_JS_TICKS_PADDING + roomForReadings
            : CHART_JS_TICKS_PADDING;
    },

    afterDatasetsDraw: (
        chart,
        _args,
        {
            enabled,
            readings = [],
            textColor,
            gapFromBar = DEFAULT_GAP_FROM_BAR,
            fadeInFrom = DEFAULT_FADE_IN_FROM,
            font,
        }
    ) => {
        if (enabled !== true) {
            return;
        }

        const { ctx } = chart;
        const bars = chart.getDatasetMeta(0).data;

        ctx.save();
        ctx.font = toFont(font).string;
        ctx.fillStyle = textColor;
        ctx.textBaseline = 'middle';

        bars.forEach((bar, index) => {
            const reading = readings[index];

            if (!reading) {
                return;
            }

            const {
                x: currentX,
                y,
                base: baseX,
            } = bar.getProps(['x', 'y', 'base'], false) as { x: number; y: number; base: number };
            const { x: finalX } = bar.getProps(['x'], true) as { x: number };

            const alpha = clamp((fractionGrown(currentX, finalX, baseX) - fadeInFrom) / (1 - fadeInFrom), 0, 1);

            if (alpha <= 0) {
                return;
            }

            const pointsRight = finalX >= baseX;

            ctx.globalAlpha = alpha;
            ctx.textAlign = pointsRight ? 'left' : 'right';
            ctx.fillText(reading, pointsRight ? currentX + gapFromBar : currentX - gapFromBar, y);
        });

        ctx.restore();
    },
};
