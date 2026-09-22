import { Chart } from 'chart.js';

import { chartRenderStatePlugin } from './plugins/chartRenderState';
import { TREND_CHART_THRESHOLD_PLUGIN_ID } from './plugins/trendChartThreshold/trendChartThreshold';
import { registerCharts } from './register';

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
