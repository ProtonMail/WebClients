import type { Chart, ChartType, Plugin } from 'chart.js';

export const TREND_CHART_THRESHOLD_PLUGIN_ID = 'protonTrendChartThreshold';

export interface TrendChartThresholdOptions {
    value?: number;
    color: string;
    dash?: number[];
    width?: number;
    /**
     * Draw muted dashed horizontal bars because chart.js v4 offers no way to dash its own grid.
     *
     * @see applications/storybook/src/stories/components/Charts.TrendChart.stories.tsx `ValueGuides` story
     */
    guides?: { values: number[]; color: string };
}

declare module 'chart.js' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- the parameter has to match chart.js's own
    interface PluginOptionsByType<TType extends ChartType> {
        [TREND_CHART_THRESHOLD_PLUGIN_ID]?: TrendChartThresholdOptions;
    }
}

interface Rule {
    y: number;
    stroke: string;
}

const strokeRules = ({ ctx, chartArea }: Chart<'line'>, rules: Rule[], dash: number[], width: number) => {
    if (!rules.length) {
        return;
    }

    ctx.save();
    ctx.setLineDash(dash);
    ctx.lineWidth = width;

    rules.forEach(({ y, stroke }) => {
        ctx.beginPath();
        ctx.strokeStyle = stroke;
        ctx.moveTo(chartArea.left, y);
        ctx.lineTo(chartArea.right, y);
        ctx.stroke();
    });

    ctx.restore();
};

const ruleAt = ({ chartArea, scales }: Chart<'line'>, reading: number | undefined, stroke: string): Rule[] => {
    if (reading === undefined) {
        return [];
    }

    const y = scales.y?.getPixelForValue(reading);

    return y === undefined || y < chartArea.top || y > chartArea.bottom ? [] : [{ y, stroke }];
};

export const trendChartThresholdPlugin: Plugin<'line'> = {
    id: TREND_CHART_THRESHOLD_PLUGIN_ID,

    beforeDatasetsDraw: (chart, _args, { dash = [4, 4], width = 1, guides }) => {
        const rules = guides ? guides.values.flatMap((reading: number) => ruleAt(chart, reading, guides.color)) : [];

        strokeRules(chart, rules, dash, width);
    },

    afterDatasetsDraw: (chart, _args, { value, color, dash = [4, 4], width = 1 }) => {
        strokeRules(chart, ruleAt(chart, value, color), dash, width);
    },
};
