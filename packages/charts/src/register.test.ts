import { Chart, Tooltip } from 'chart.js';

import { BAR_CHART_ACTIVE_ROW_PLUGIN_ID } from './plugins/barChartActiveRow/barChartActiveRow';
import { BAR_CHART_VALUE_LABELS_PLUGIN_ID } from './plugins/barChartValueLabels/barChartValueLabels';
import { chartRenderStatePlugin } from './plugins/chartRenderState';
import { TREND_CHART_THRESHOLD_PLUGIN_ID } from './plugins/trendChartThreshold/trendChartThreshold';
import { registerCharts } from './register';
import { ROW_CURSOR_POSITIONER_ID } from './tooltip/rowCursorPosition';

describe('importing a primitive', () => {
    it('registers what a chart needs, so nothing has to be called at an entry point', async () => {
        expect(() => Chart.registry.getController('line')).toThrow();

        await import('./primitives/LineChart');

        expect(Chart.registry.getController('line')).toBeDefined();
        expect(Chart.registry.getElement('line')).toBeDefined();
        expect(Chart.registry.getElement('point')).toBeDefined();
        expect(Chart.registry.getScale('category')).toBeDefined();
        expect(Chart.registry.getScale('linear')).toBeDefined();
        expect(Chart.registry.getPlugin('filler')).toBeDefined();
    });

    it('registers the plugin the screenshot suite waits on', async () => {
        await import('./primitives/LineChart');

        expect(Chart.registry.getPlugin(chartRenderStatePlugin.id)).toBeDefined();
    });

    it('registers what a bar chart needs, from either primitive', async () => {
        await import('./primitives/BarChart');

        expect(Chart.registry.getController('bar')).toBeDefined();
        expect(Chart.registry.getElement('bar')).toBeDefined();
    });

    it('registers the plugin that writes a reading past the end of a bar', async () => {
        await import('./primitives/BarChart');

        expect(Chart.registry.getPlugin(BAR_CHART_VALUE_LABELS_PLUGIN_ID)).toBeDefined();
    });

    it('registers the plugin that bands the row a pointer is on', async () => {
        await import('./primitives/BarChart');

        expect(Chart.registry.getPlugin(BAR_CHART_ACTIVE_ROW_PLUGIN_ID)).toBeDefined();
    });

    it('registers the positioner that walks a tooltip along its row', async () => {
        await import('./primitives/BarChart');

        expect(Tooltip.positioners[ROW_CURSOR_POSITIONER_ID]).toBeDefined();
    });

    it('registers the plugin that draws a threshold', async () => {
        await import('./primitives/LineChart');

        expect(Chart.registry.getPlugin(TREND_CHART_THRESHOLD_PLUGIN_ID)).toBeDefined();
    });
});

describe('registerCharts', () => {
    it('registers the scales, controllers and elements the package charts need', () => {
        registerCharts();

        expect(Chart.registry.getScale('category')).toBeDefined();
        expect(Chart.registry.getScale('linear')).toBeDefined();
        expect(Chart.registry.getController('line')).toBeDefined();
        expect(Chart.registry.getElement('line')).toBeDefined();
        expect(Chart.registry.getElement('point')).toBeDefined();
        expect(Chart.registry.getController('bar')).toBeDefined();
        expect(Chart.registry.getElement('bar')).toBeDefined();
        expect(Chart.registry.getPlugin('tooltip')).toBeDefined();
        expect(Chart.registry.getPlugin('filler')).toBeDefined();
    });

    it('is safe to call more than once', () => {
        expect(() => {
            registerCharts();
            registerCharts();
            registerCharts();
        }).not.toThrow();
    });

    it('does not register any plugin no package chart uses', () => {
        registerCharts();

        expect(() => Chart.registry.getPlugin('decimation')).toThrow();
        expect(() => Chart.registry.getPlugin('legend')).toThrow();
    });
});
