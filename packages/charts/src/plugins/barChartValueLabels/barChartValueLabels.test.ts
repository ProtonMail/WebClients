import type { BarElement, Chart } from 'chart.js';

import type { BarChartValueLabelsOptions } from './barChartValueLabels';
import { barChartValueLabelsPlugin } from './barChartValueLabels';

const bar = ({ x, finalX = x, y, base = 0 }: { x: number; finalX?: number; y: number; base?: number }) =>
    ({
        getProps: (props: string[], final?: boolean) => {
            const source: Record<string, number> = { x: final ? finalX : x, y, base };

            return Object.fromEntries(props.map((prop) => [prop, source[prop]]));
        },
    }) as unknown as BarElement;

const spyContext = () => ({
    font: '',
    fillStyle: '',
    textAlign: '',
    textBaseline: '',
    globalAlpha: 1,
    writes: [] as { text: string; x: number; y: number; align: string; alpha: number }[],
    fonts: [] as string[],
    measured: [] as string[],
    depth: 0,
    save() {
        this.depth += 1;
    },
    restore() {
        this.depth -= 1;
    },
    measureText(text: string) {
        this.measured.push(text);
        this.fonts.push(this.font);

        return { width: text.length * 10 };
    },
    fillText(text: string, x: number, y: number) {
        this.writes.push({ text, x, y, align: this.textAlign, alpha: this.globalAlpha });
    },
});

type SpyContext = ReturnType<typeof spyContext>;

const chartWith = ({
    ctx,
    bars = [],
    layout,
    min,
    data = [],
}: {
    ctx: SpyContext;
    bars?: BarElement[];
    layout?: unknown;
    min?: number;
    data?: number[];
}) =>
    ({
        ctx,
        data: { datasets: [{ data }] },
        options: { layout, scales: { x: { min } } },
        scales: { y: { options: { ticks: { color: '#000' } } } },
        getDatasetMeta: () => ({ data: bars }),
    }) as unknown as Chart<'bar'>;

const options = (overrides: Partial<BarChartValueLabelsOptions> = {}): BarChartValueLabelsOptions => ({
    enabled: true,
    readings: [],
    textColor: '#5c5958',
    ...overrides,
});

const categoryTicks = (chart: Chart<'bar'>) =>
    (chart.scales.y.options as unknown as { ticks: { padding: number; color: string } }).ticks;

const reserved = (chart: Chart<'bar'>) =>
    (chart.options.layout as { padding: { right: number } } | undefined)?.padding.right;

describe('barChartValueLabels reserving room', () => {
    it('keeps the widest reading off the edge of the canvas, so the longest bar still shows its number', () => {
        const ctx = spyContext();
        const chart = chartWith({ ctx });

        barChartValueLabelsPlugin.beforeLayout?.(
            chart,
            {} as never,
            options({ readings: ['72', '1.2 TB'], gapFromBar: 8 })
        );

        expect(reserved(chart)).toBe('1.2 TB'.length * 10 + 8);
    });

    it('measures a reading in the font it will be written in', () => {
        const ctx = spyContext();

        barChartValueLabelsPlugin.beforeLayout?.(
            chartWith({ ctx }),
            {} as never,
            options({ readings: ['72'], font: { size: 20 } })
        );

        expect(ctx.fonts[0]).toContain('20px');
    });

    it('leaves the padding a caller already set alone', () => {
        const chart = chartWith({ ctx: spyContext(), layout: { padding: { left: 12, right: 99 } } });

        barChartValueLabelsPlugin.beforeLayout?.(chart, {} as never, options({ readings: ['72'] }));

        expect((chart.options.layout as { padding: { left: number } }).padding.left).toBe(12);
    });

    it('ignores a padding that is not an object of sides', () => {
        const chart = chartWith({ ctx: spyContext(), layout: { padding: [4, 8] } });

        barChartValueLabelsPlugin.beforeLayout?.(chart, {} as never, options({ readings: ['72'], gapFromBar: 8 }));

        expect(reserved(chart)).toBe('72'.length * 10 + 8);
    });

    it('widens the gap between the names and the plot where a reading runs below the axis', () => {
        const chart = chartWith({ ctx: spyContext(), data: [-40, 80] });

        barChartValueLabelsPlugin.beforeLayout?.(
            chart,
            {} as never,
            options({ readings: ['-40', '80'], gapFromBar: 8 })
        );

        expect(categoryTicks(chart).padding).toBeGreaterThanOrEqual('-40'.length * 10 + 8);
        expect(categoryTicks(chart).color).toBe('#000');
    });

    it('settles on the same gap however many times it lays out', () => {
        const chart = chartWith({ ctx: spyContext(), data: [-40, 80] });
        const lay = () =>
            barChartValueLabelsPlugin.beforeLayout?.(chart, {} as never, options({ readings: ['-40', '80'] }));

        lay();
        const first = categoryTicks(chart).padding;
        lay();
        lay();

        expect(categoryTicks(chart).padding).toBe(first);
    });

    it('leaves the names where they are where every reading is above the axis', () => {
        const chart = chartWith({ ctx: spyContext(), data: [72, 80], min: -40 });

        barChartValueLabelsPlugin.beforeLayout?.(chart, {} as never, options({ readings: ['72', '80'] }));

        expect(categoryTicks(chart).padding).toBeLessThan(10);
    });

    it('keeps no room on the left of the canvas, which would only pad the far side of the names', () => {
        const chart = chartWith({ ctx: spyContext(), data: [-40, 80] });

        barChartValueLabelsPlugin.beforeLayout?.(chart, {} as never, options({ readings: ['-40', '80'] }));

        expect((chart.options.layout as { padding: { left?: number } }).padding.left).toBeUndefined();
    });

    it('asks for no room at all where it will write nothing', () => {
        const chart = chartWith({ ctx: spyContext(), layout: { padding: { right: 4 } } });

        barChartValueLabelsPlugin.beforeLayout?.(chart, {} as never, options({ enabled: false, readings: ['72'] }));

        expect(reserved(chart)).toBe(4);
    });

    it('leaves a chart that never asked for readings exactly as it is, since every chart is handed to it', () => {
        const chart = chartWith({ ctx: spyContext() });

        barChartValueLabelsPlugin.beforeLayout?.(chart, {} as never, {} as BarChartValueLabelsOptions);

        expect(chart.options.layout).toBeUndefined();
    });

    it('hands back the context as it found it', () => {
        const ctx = spyContext();

        barChartValueLabelsPlugin.beforeLayout?.(chartWith({ ctx }), {} as never, options({ readings: ['72'] }));

        expect(ctx.depth).toBe(0);
    });
});

describe('barChartValueLabels writing', () => {
    it('writes each reading just past the end of its bar', () => {
        const ctx = spyContext();
        const chart = chartWith({ ctx, bars: [bar({ x: 120, y: 10 }), bar({ x: 60, y: 30 })] });

        barChartValueLabelsPlugin.afterDatasetsDraw?.(
            chart,
            {} as never,
            options({ readings: ['782', '279'], gapFromBar: 8 }),
            false
        );

        expect(ctx.writes.map(({ text, x, y, align }) => ({ text, x, y, align }))).toEqual([
            { text: '782', x: 128, y: 10, align: 'left' },
            { text: '279', x: 68, y: 30, align: 'left' },
        ]);
    });

    it('writes a bar that runs backwards on the other side of its end', () => {
        const ctx = spyContext();
        const chart = chartWith({ ctx, bars: [bar({ x: 20, y: 10, base: 100 })] });

        barChartValueLabelsPlugin.afterDatasetsDraw?.(
            chart,
            {} as never,
            options({ readings: ['-80'], gapFromBar: 8 }),
            false
        );

        expect(ctx.writes[0]).toMatchObject({ text: '-80', x: 12, align: 'right' });
    });

    it('says nothing about a bar it was given no reading for', () => {
        const ctx = spyContext();
        const chart = chartWith({ ctx, bars: [bar({ x: 120, y: 10 }), bar({ x: 60, y: 30 })] });

        barChartValueLabelsPlugin.afterDatasetsDraw?.(chart, {} as never, options({ readings: ['782'] }), false);

        expect(ctx.writes.map(({ text }) => text)).toEqual(['782']);
    });

    it('writes nothing on a chart that never asked for readings, since every chart is handed to it', () => {
        const ctx = spyContext();
        const chart = chartWith({ ctx, bars: [bar({ x: 120, y: 10 })] });

        expect(() =>
            barChartValueLabelsPlugin.afterDatasetsDraw?.(chart, {} as never, {} as BarChartValueLabelsOptions, false)
        ).not.toThrow();
        expect(ctx.writes).toEqual([]);
    });

    it('writes nothing at all while a chart is still waiting on its data', () => {
        const ctx = spyContext();
        const chart = chartWith({ ctx, bars: [bar({ x: 120, y: 10 })] });

        barChartValueLabelsPlugin.afterDatasetsDraw?.(
            chart,
            {} as never,
            options({ enabled: false, readings: ['782'] }),
            false
        );

        expect(ctx.writes).toEqual([]);
    });

    it('hands back the context as it found it', () => {
        const ctx = spyContext();
        const chart = chartWith({ ctx, bars: [bar({ x: 120, y: 10 })] });

        barChartValueLabelsPlugin.afterDatasetsDraw?.(chart, {} as never, options({ readings: ['782'] }), false);

        expect(ctx.depth).toBe(0);
    });
});

describe('barChartValueLabels arriving', () => {
    const alphaOf = (grown: number, fadeInFrom = 0.85) => {
        const ctx = spyContext();
        const chart = chartWith({ ctx, bars: [bar({ x: 100 * grown, finalX: 100, y: 10 })] });

        barChartValueLabelsPlugin.afterDatasetsDraw?.(
            chart,
            {} as never,
            options({ readings: ['782'], fadeInFrom }),
            false
        );

        return ctx.writes[0]?.alpha ?? 0;
    };

    it('stays away while its bar is still growing, rather than travelling along with the end of it', () => {
        expect(alphaOf(0.2)).toBe(0);
        expect(alphaOf(0.8)).toBe(0);
    });

    it('fades in as the bar settles', () => {
        expect(alphaOf(0.9)).toBeCloseTo(1 / 3);
        expect(alphaOf(1)).toBe(1);
    });

    it('is there from the first frame where nothing is fading in', () => {
        expect(alphaOf(0, 0)).toBe(0);
        expect(alphaOf(1, 0)).toBe(1);
    });

    it('writes a bar of no length at all, which has no growing left to do', () => {
        const ctx = spyContext();
        const chart = chartWith({ ctx, bars: [bar({ x: 40, finalX: 40, y: 10, base: 40 })] });

        barChartValueLabelsPlugin.afterDatasetsDraw?.(chart, {} as never, options({ readings: ['0'] }), false);

        expect(ctx.writes[0]).toMatchObject({ text: '0', alpha: 1 });
    });
});
