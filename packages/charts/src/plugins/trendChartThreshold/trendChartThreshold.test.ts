import type { Chart, ChartArea, Scale } from 'chart.js';

import type { TrendChartThresholdOptions } from './trendChartThreshold';
import { trendChartThresholdPlugin } from './trendChartThreshold';

const AREA = { top: 10, bottom: 110, left: 20, right: 220 } as ChartArea;

const spyContext = () => ({
    calls: [] as string[],
    dash: undefined as number[] | undefined,
    strokeStyle: '',
    lineWidth: 0,
    save() {
        this.calls.push('save');
    },
    restore() {
        this.calls.push('restore');
    },
    beginPath() {
        this.calls.push('beginPath');
    },
    stroke() {
        this.calls.push('stroke');
    },
    setLineDash(dash: number[]) {
        this.dash = dash;
    },
    moveTo(x: number, y: number) {
        this.calls.push(`moveTo(${x},${y})`);
    },
    lineTo(x: number, y: number) {
        this.calls.push(`lineTo(${x},${y})`);
    },
});

const draw = (options: TrendChartThresholdOptions, getPixelForValue: (value: number) => number) => {
    const ctx = spyContext();

    trendChartThresholdPlugin.afterDatasetsDraw?.(
        { ctx, chartArea: AREA, scales: { y: { getPixelForValue } as Scale } } as unknown as Chart<'line'>,
        {},
        options,
        false
    );

    return ctx;
};

const across = (value: number) => draw({ value, color: '#dc3251' }, () => 60);

describe('chartThresholdPlugin', () => {
    it('strokes a dashed rule across the plot at the value it is given', () => {
        const ctx = across(80);

        expect(ctx.calls).toEqual(['save', 'beginPath', 'moveTo(20,60)', 'lineTo(220,60)', 'stroke', 'restore']);
        expect(ctx.dash).toEqual([4, 4]);
        expect(ctx.strokeStyle).toBe('#dc3251');
        expect(ctx.lineWidth).toBe(1);
    });

    it('takes the dash and the width from its options', () => {
        const ctx = draw({ value: 80, color: '#dc3251', dash: [2, 6], width: 3 }, () => 60);

        expect(ctx.dash).toEqual([2, 6]);
        expect(ctx.lineWidth).toBe(3);
    });

    it('draws nothing at all without a value', () => {
        const ctx = draw({ color: '#dc3251' }, () => 60);

        expect(ctx.calls).toEqual([]);
    });

    it('draws nothing for a threshold the value axis does not reach', () => {
        expect(draw({ value: 500, color: '#dc3251' }, () => AREA.top - 1).calls).toEqual([]);
        expect(draw({ value: -500, color: '#dc3251' }, () => AREA.bottom + 1).calls).toEqual([]);
    });

    it('draws on the edges themselves, which the axis does reach', () => {
        expect(draw({ value: 100, color: '#dc3251' }, () => AREA.top).calls).toContain('moveTo(20,10)');
        expect(draw({ value: 0, color: '#dc3251' }, () => AREA.bottom).calls).toContain('moveTo(20,110)');
    });

    it('survives a chart with no value axis', () => {
        const ctx = spyContext();

        expect(() =>
            trendChartThresholdPlugin.afterDatasetsDraw?.(
                { ctx, chartArea: AREA, scales: {} } as unknown as Chart<'line'>,
                {},
                { value: 80, color: '#dc3251' },
                false
            )
        ).not.toThrow();
    });
});
