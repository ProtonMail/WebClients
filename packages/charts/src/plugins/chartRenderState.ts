import type { Plugin } from 'chart.js';

export const CHART_RENDERED_ATTRIBUTE = 'data-chart-rendered';

export const chartRenderStatePlugin: Plugin = {
    id: 'protonChartRenderState',
    beforeRender: ({ canvas }) => {
        canvas?.setAttribute(CHART_RENDERED_ATTRIBUTE, 'false');
    },
    afterRender: ({ canvas }) => {
        canvas?.setAttribute(CHART_RENDERED_ATTRIBUTE, 'true');
    },
};
