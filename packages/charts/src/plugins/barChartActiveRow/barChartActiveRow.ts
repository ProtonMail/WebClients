import type { ChartType, Plugin, Scale } from 'chart.js';

export const BAR_CHART_ACTIVE_ROW_PLUGIN_ID = 'protonBarChartActiveRow';

export interface BarChartActiveRowOptions {
    enabled?: boolean;
    color: string;
}

declare module 'chart.js' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- the parameter has to match chart.js's own
    interface PluginOptionsByType<TType extends ChartType> {
        [BAR_CHART_ACTIVE_ROW_PLUGIN_ID]?: BarChartActiveRowOptions;
    }
}

const rowHeight = (axis: Scale) => {
    const rows = axis.ticks.length;

    if (rows === 0) {
        return 0;
    }

    if (rows === 1) {
        return axis.height;
    }

    return Math.abs(axis.getPixelForTick(1) - axis.getPixelForTick(0));
};

export const barChartActiveRowPlugin: Plugin<'bar'> = {
    id: BAR_CHART_ACTIVE_ROW_PLUGIN_ID,

    beforeDatasetsDraw: (chart, _args, { enabled, color }) => {
        if (enabled !== true) {
            return;
        }

        const [active] = chart.getActiveElements();
        const axis = chart.scales.y;
        const { chartArea } = chart;

        if (active === undefined || axis === undefined || chartArea === undefined) {
            return;
        }

        const height = rowHeight(axis);

        if (height === 0) {
            return;
        }

        const center = axis.getPixelForTick(active.index);

        if (!Number.isFinite(center)) {
            return;
        }

        const { ctx } = chart;

        ctx.save();
        ctx.fillStyle = color;
        ctx.fillRect(chartArea.left, center - height / 2, chart.width - chartArea.left, height);
        ctx.restore();
    },
};
