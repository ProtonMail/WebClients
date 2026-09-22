import type { ChartType, Plugin, Scale } from 'chart.js';

export const TREND_CHART_PLACEHOLDER_TICKS_PLUGIN_ID = 'protonTrendChartPlaceholderTicks';

export interface TrendChartPlaceholderTicksOptions {
    enabled?: boolean;
    color: string;
    alpha?: number;
}

const BLOCK = {
    value: { width: 20, height: 6 },
    label: { width: 28, height: 6 },
    radius: 3,
    gap: 8,
} as const;

declare module 'chart.js' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- the parameter has to match chart.js's own
    interface PluginOptionsByType<TType extends ChartType> {
        [TREND_CHART_PLACEHOLDER_TICKS_PLUGIN_ID]?: TrendChartPlaceholderTicksOptions;
    }
}

const eachTick = (scale: Scale | undefined, draw: (pixel: number) => void) => {
    if (!scale) {
        return;
    }

    scale.ticks.forEach((_tick, index) => {
        const pixel = scale.getPixelForTick(index);

        if (Number.isFinite(pixel)) {
            draw(pixel);
        }
    });
};

/**
 * Fills one rounded block, or a squared-off one where the browser has no rounded rectangle to draw.
 *
 * `roundRect` needs Safari 16.4 / Chrome 99, above the Safari 14 / iOS 14 / Chrome 80 floor in
 * `.browserslistrc`, and a canvas method is not something core-js can fill in for us: calling it on an older
 * browser throws inside chart.js's draw loop and takes the whole chart down, not merely these blocks. So it
 * is asked for rather than assumed, and the corners are what degrades rather than the block itself.
 */
const fillBlock = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
) => {
    ctx.beginPath();

    if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, width, height, radius);
    } else {
        ctx.rect(x, y, width, height);
    }

    ctx.fill();
};

/**
 * Blocks where the axis labels will be, for a chart that has no readings to write there yet.
 *
 * Drawn on the canvas rather than laid over it, so there is nothing to place: chart.js already knows where
 * every tick sits, and asking it is exact by construction where a stack of positioned elements outside the
 * canvas would be a second opinion about the same layout. It also means the placeholders are muted, clipped
 * and scaled with the chart, because they are the chart.
 *
 * Drawn per tick the scales actually built, so the count matches what the real series will show rather than
 * being a number chosen here.
 */
export const trendChartPlaceholderTicksPlugin: Plugin<'line'> = {
    id: TREND_CHART_PLACEHOLDER_TICKS_PLUGIN_ID,

    afterDatasetsDraw: ({ ctx, chartArea, scales }, _args, { enabled, color, alpha = 0.5 }) => {
        if (!enabled || !chartArea) {
            return;
        }

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;

        eachTick(scales.y, (y) => {
            fillBlock(
                ctx,
                chartArea.left - BLOCK.gap - BLOCK.value.width,
                y - BLOCK.value.height / 2,
                BLOCK.value.width,
                BLOCK.value.height,
                BLOCK.radius
            );
        });

        eachTick(scales.x, (x) => {
            fillBlock(
                ctx,
                x - BLOCK.label.width / 2,
                chartArea.bottom + BLOCK.gap,
                BLOCK.label.width,
                BLOCK.label.height,
                BLOCK.radius
            );
        });

        ctx.restore();
    },
};
