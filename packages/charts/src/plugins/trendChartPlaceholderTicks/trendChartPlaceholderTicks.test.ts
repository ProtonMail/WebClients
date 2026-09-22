import type { Chart, Scale } from 'chart.js';

import { type TrendChartPlaceholderTicksOptions, trendChartPlaceholderTicksPlugin } from './trendChartPlaceholderTicks';

const ctxSpy = ({ roundRect = true } = {}) => {
    const blocks: { x: number; y: number; width: number; height: number }[] = [];

    const record = (x: number, y: number, width: number, height: number) => {
        blocks.push({ x, y, width, height });
    };

    return {
        blocks,
        ctx: {
            save: () => {},
            restore: () => {},
            beginPath: () => {},
            fill: () => {},
            globalAlpha: 1,
            fillStyle: '',
            rect: record,
            ...(roundRect ? { roundRect: record } : {}),
        },
    };
};

const scaleOf = (pixels: number[]) =>
    ({
        ticks: pixels.map(() => ({ value: 0 })),
        getPixelForTick: (index: number) => pixels[index],
    }) as unknown as Scale;

const draw = (options: TrendChartPlaceholderTicksOptions, { x = [100], y = [50], roundRect = true } = {}) => {
    const { ctx, blocks } = ctxSpy({ roundRect });

    trendChartPlaceholderTicksPlugin.afterDatasetsDraw?.(
        {
            ctx,
            chartArea: { left: 46, top: 10, right: 648, bottom: 162 },
            scales: { x: scaleOf(x), y: scaleOf(y) },
        } as unknown as Chart<'line'>,
        {} as never,
        options,
        false
    );

    return blocks;
};

describe('trendChartPlaceholderTicksPlugin', () => {
    it('draws nothing for a chart that has readings of its own', () => {
        expect(draw({ enabled: false, color: '#6d4aff' })).toHaveLength(0);
    });

    it('draws one block per tick the scales built, so the count is the axis’s and not its own', () => {
        expect(draw({ enabled: true, color: '#6d4aff' }, { y: [40, 80, 120], x: [100, 200] })).toHaveLength(5);
    });

    it('sits the value blocks off the plot, clear of the line they label', () => {
        const [block] = draw({ enabled: true, color: '#6d4aff' }, { y: [50], x: [] });

        expect(block.x + block.width).toBeLessThan(46);
        expect(block.y).toBeLessThan(50);
        expect(block.y + block.height).toBeGreaterThan(50);
    });

    it('centres the label blocks under their tick, below the plot', () => {
        const [block] = draw({ enabled: true, color: '#6d4aff' }, { y: [], x: [300] });

        expect(block.x + block.width / 2).toBe(300);
        expect(block.y).toBeGreaterThan(162);
    });

    it('squares the blocks off on a browser with no rounded rectangle to draw, rather than dropping them', () => {
        const [block] = draw({ enabled: true, color: '#6d4aff' }, { y: [], x: [300], roundRect: false });

        expect(block.x + block.width / 2).toBe(300);
        expect(block.y).toBeGreaterThan(162);
    });

    it('draws nothing before there is a plot', () => {
        const { ctx, blocks } = ctxSpy();

        trendChartPlaceholderTicksPlugin.afterDatasetsDraw?.(
            { ctx, chartArea: undefined, scales: {} } as unknown as Chart<'line'>,
            {} as never,
            { enabled: true, color: '#6d4aff' },
            false
        );

        expect(blocks).toHaveLength(0);
    });

    it('skips a tick with no pixel to sit at', () => {
        expect(draw({ enabled: true, color: '#6d4aff' }, { y: [Number.NaN], x: [] })).toHaveLength(0);
    });
});
