import type { Chart } from 'chart.js';

import { CHART_RENDERED_ATTRIBUTE, chartRenderStatePlugin } from './chartRenderState';

const asChart = (canvas: HTMLCanvasElement | null) => ({ canvas }) as Chart;

const call = (hook: 'beforeRender' | 'afterRender', chart: Chart) => {
    chartRenderStatePlugin[hook]?.(chart, { cancelable: true } as never, {} as never);
};

describe('chartRenderStatePlugin', () => {
    it('marks a canvas as not yet drawn before a frame', () => {
        const canvas = document.createElement('canvas');

        call('beforeRender', asChart(canvas));

        expect(canvas.getAttribute(CHART_RENDERED_ATTRIBUTE)).toBe('false');
    });

    it('marks a canvas as drawn after a frame', () => {
        const canvas = document.createElement('canvas');

        call('beforeRender', asChart(canvas));
        call('afterRender', asChart(canvas));

        expect(canvas.getAttribute(CHART_RENDERED_ATTRIBUTE)).toBe('true');
    });

    it('flags a redraw, so a screenshot waits for the new frame instead of the old one', () => {
        const canvas = document.createElement('canvas');

        call('afterRender', asChart(canvas));
        call('beforeRender', asChart(canvas));

        expect(canvas.getAttribute(CHART_RENDERED_ATTRIBUTE)).toBe('false');
    });

    it('survives a chart that has lost its canvas', () => {
        expect(() => {
            call('beforeRender', asChart(null));
            call('afterRender', asChart(null));
        }).not.toThrow();
    });
});
