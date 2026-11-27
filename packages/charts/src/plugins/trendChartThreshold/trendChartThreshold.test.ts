import type { Chart, ChartArea, Scale } from 'chart.js';

import type { TrendChartThresholdOptions } from './trendChartThreshold';
import { trendChartThresholdPlugin } from './trendChartThreshold';

const AREA = { top: 10, bottom: 110, left: 20, right: 220 } as ChartArea;

const spyContext = () => ({
    calls: [] as string[],
    strokes: [] as string[],
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
        this.strokes.push(this.strokeStyle);
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

/** Both hooks, in the order chart.js runs them around the datasets. */
const draw = (options: TrendChartThresholdOptions, getPixelForValue: (value: number) => number) => {
    const ctx = spyContext();
    const chart = {
        ctx,
        chartArea: AREA,
        scales: { y: { getPixelForValue } as Scale },
    } as unknown as Chart<'line'>;

    trendChartThresholdPlugin.beforeDatasetsDraw?.(chart, { cancelable: true }, options);
    trendChartThresholdPlugin.afterDatasetsDraw?.(chart, {}, options, false);

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
                {
                    ctx,
                    chartArea: AREA,
                    scales: {},
                } as unknown as Chart<'line'>,
                {},
                { value: 80, color: '#dc3251' },
                false
            )
        ).not.toThrow();
    });
});

describe('chartThresholdPlugin guides', () => {
    const GUIDE = '#d1cfcf';
    const THRESHOLD = '#dc3251';

    const asPercentage = (reading: number) => AREA.bottom - reading;

    const withGuides = (values: number[], options: Partial<TrendChartThresholdOptions> = {}) =>
        draw({ color: THRESHOLD, guides: { values, color: GUIDE }, ...options }, asPercentage);

    it('carries each reading the axis names across the plot', () => {
        const ctx = withGuides([0, 50, 100]);

        expect(ctx.calls).toEqual([
            'save',
            'beginPath',
            'moveTo(20,110)',
            'lineTo(220,110)',
            'stroke',
            'beginPath',
            'moveTo(20,60)',
            'lineTo(220,60)',
            'stroke',
            'beginPath',
            'moveTo(20,10)',
            'lineTo(220,10)',
            'stroke',
            'restore',
        ]);
    });

    it('draws the guides faintly and the threshold in its own colour', () => {
        expect(withGuides([0, 50, 100], { value: 75 }).strokes).toEqual([GUIDE, GUIDE, GUIDE, THRESHOLD]);
    });

    it('draws the threshold last, so it is the rule on top where the two meet', () => {
        const ctx = withGuides([50], { value: 50 });

        expect(ctx.calls).toEqual([
            'save',
            'beginPath',
            'moveTo(20,60)',
            'lineTo(220,60)',
            'stroke',
            'restore',
            'save',
            'beginPath',
            'moveTo(20,60)',
            'lineTo(220,60)',
            'stroke',
            'restore',
        ]);
        expect(ctx.strokes).toEqual([GUIDE, THRESHOLD]);
    });

    it('draws the guides under the series and the threshold over it', () => {
        const chart = (ctx: ReturnType<typeof spyContext>) =>
            ({
                ctx,
                chartArea: AREA,
                scales: { y: { getPixelForValue: asPercentage } as Scale },
            }) as unknown as Chart<'line'>;
        const options = { value: 75, color: THRESHOLD, guides: { values: [50], color: GUIDE } };

        const before = spyContext();
        trendChartThresholdPlugin.beforeDatasetsDraw?.(chart(before), { cancelable: true }, options);

        const after = spyContext();
        trendChartThresholdPlugin.afterDatasetsDraw?.(chart(after), {}, options, false);

        expect(before.strokes).toEqual([GUIDE]);
        expect(after.strokes).toEqual([THRESHOLD]);
    });

    it('drops a reading the plot does not reach, rather than drawing it on the edge', () => {
        expect(withGuides([-20, 50, 140]).strokes).toEqual([GUIDE]);
    });

    it('draws the guides on their own, without a threshold to sit under', () => {
        expect(withGuides([25, 75]).strokes).toEqual([GUIDE, GUIDE]);
    });

    it('draws the threshold on its own, with no guides asked for', () => {
        expect(draw({ value: 50, color: THRESHOLD }, asPercentage).strokes).toEqual([THRESHOLD]);
    });

    it('leaves the canvas untouched when every guide falls outside the plot and there is no threshold', () => {
        expect(withGuides([-20, 140]).calls).toEqual([]);
    });

    it('leaves the canvas untouched when asked for no guides and no threshold', () => {
        expect(withGuides([]).calls).toEqual([]);
    });

    it('dashes the guides, which are a measure to read against rather than part of the picture', () => {
        expect(withGuides([50]).dash).toEqual([4, 4]);
    });
});
