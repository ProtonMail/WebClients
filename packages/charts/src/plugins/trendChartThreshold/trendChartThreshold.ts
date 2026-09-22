import type { ChartType, Plugin } from 'chart.js';

export const TREND_CHART_THRESHOLD_PLUGIN_ID = 'protonTrendChartThreshold';

export interface TrendChartThresholdOptions {
    value?: number;
    color: string;
    dash?: number[];
    width?: number;
}

declare module 'chart.js' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- the parameter has to match chart.js's own
    interface PluginOptionsByType<TType extends ChartType> {
        [TREND_CHART_THRESHOLD_PLUGIN_ID]?: TrendChartThresholdOptions;
    }
}

/**
 * A dashed rule across the plot at one value on the value axis.
 */
export const trendChartThresholdPlugin: Plugin<'line'> = {
    id: TREND_CHART_THRESHOLD_PLUGIN_ID,

    afterDatasetsDraw: ({ ctx, chartArea, scales }, _args, { value, color, dash = [4, 4], width = 1 }) => {
        if (value === undefined) {
            return;
        }

        const y = scales.y?.getPixelForValue(value);
        if (y === undefined || y < chartArea.top || y > chartArea.bottom) {
            return;
        }

        ctx.save();
        ctx.beginPath();
        ctx.setLineDash(dash);
        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.moveTo(chartArea.left, y);
        ctx.lineTo(chartArea.right, y);
        ctx.stroke();
        ctx.restore();
    },
};
