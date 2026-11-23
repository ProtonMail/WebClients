import type { ChartType, ChartTypeRegistry, Plugin, Scale } from 'chart.js';

export const TREND_CHART_PLACEHOLDER_TICKS_PLUGIN_ID = 'protonTrendChartPlaceholderTicks';

export interface TrendChartPlaceholderTicksOptions {
    enabled?: boolean;
    color: string;
    alpha?: number;
    axes?: ('x' | 'y')[];
}

const BLOCK = {
    value: { width: 20, height: 6 },
    label: { width: 28, height: 6 },
    radius: 3,
    gap: 8,
} as const;

export const PLACEHOLDER_TICKS_ROOM = BLOCK.value.width + BLOCK.gap;

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

export const trendChartPlaceholderTicksPlugin: Plugin<keyof ChartTypeRegistry> = {
    id: TREND_CHART_PLACEHOLDER_TICKS_PLUGIN_ID,

    afterDatasetsDraw: ({ ctx, chartArea, scales }, _args, { enabled, color, alpha = 0.5, axes = ['x', 'y'] }) => {
        if (!enabled || !chartArea) {
            return;
        }

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;

        if (axes.includes('y')) {
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
        }

        if (axes.includes('x')) {
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
        }

        ctx.restore();
    },
};
