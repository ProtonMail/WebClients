import type { ActiveElement, Chart, Scale } from 'chart.js';

import type { BarChartActiveRowOptions } from './barChartActiveRow';
import { barChartActiveRowPlugin } from './barChartActiveRow';

const spyContext = () => ({
    fillStyle: '',
    fills: [] as { x: number; y: number; width: number; height: number; color: string }[],
    depth: 0,
    save() {
        this.depth += 1;
    },
    restore() {
        this.depth -= 1;
    },
    fillRect(x: number, y: number, width: number, height: number) {
        this.fills.push({ x, y, width, height, color: this.fillStyle });
    },
});

type SpyContext = ReturnType<typeof spyContext>;

const axisOf = (rows: number, { top = 0, height = 400 } = {}) =>
    ({
        ticks: Array.from({ length: rows }, (_row, index) => ({ value: index })),
        height,
        getPixelForTick: (index: number) => top + (height / rows) * (index + 0.5),
    }) as unknown as Scale;

const chartWith = ({
    ctx,
    rows = 4,
    active = [] as ActiveElement[],
    width = 600,
    left = 80,
}: {
    ctx: SpyContext;
    rows?: number;
    active?: ActiveElement[];
    width?: number;
    left?: number;
}) =>
    ({
        ctx,
        width,
        chartArea: { left, top: 0, right: width - 40, bottom: 400 },
        scales: { y: axisOf(rows) },
        getActiveElements: () => active,
    }) as unknown as Chart<'bar'>;

const options = (overrides: Partial<BarChartActiveRowOptions> = {}): BarChartActiveRowOptions => ({
    enabled: true,
    color: 'rgb(194 193 192 / 0.2)',
    ...overrides,
});

const band = (ctx: SpyContext) => ctx.fills[0];

describe('barChartActiveRow', () => {
    it('bands the row the pointer is on, centred on it and as tall as a row', () => {
        const ctx = spyContext();

        barChartActiveRowPlugin.beforeDatasetsDraw?.(
            chartWith({ ctx, rows: 4, active: [{ datasetIndex: 0, index: 1 } as ActiveElement] }),
            {} as never,
            options()
        );

        expect(band(ctx)).toEqual({
            x: 80,
            y: 100,
            width: 520,
            height: 100,
            color: 'rgb(194 193 192 / 0.2)',
        });
    });

    it('starts at the plot, leaving the name of the row outside it', () => {
        const ctx = spyContext();

        barChartActiveRowPlugin.beforeDatasetsDraw?.(
            chartWith({ ctx, active: [{ datasetIndex: 0, index: 0 } as ActiveElement], left: 120 }),
            {} as never,
            options()
        );

        expect(band(ctx)).toMatchObject({ x: 120 });
    });

    it('runs past the plot to the edge of the canvas, where the reading of the bar is written', () => {
        const ctx = spyContext();

        barChartActiveRowPlugin.beforeDatasetsDraw?.(
            chartWith({ ctx, active: [{ datasetIndex: 0, index: 0 } as ActiveElement], width: 900, left: 100 }),
            {} as never,
            options()
        );

        expect(band(ctx).x + band(ctx).width).toBe(900);
    });

    it('bands a chart of one row across the whole of it', () => {
        const ctx = spyContext();

        barChartActiveRowPlugin.beforeDatasetsDraw?.(
            chartWith({ ctx, rows: 1, active: [{ datasetIndex: 0, index: 0 } as ActiveElement] }),
            {} as never,
            options()
        );

        expect(band(ctx)).toMatchObject({ y: 0, height: 400 });
    });

    it('bands nothing where the pointer is on nothing', () => {
        const ctx = spyContext();

        barChartActiveRowPlugin.beforeDatasetsDraw?.(chartWith({ ctx }), {} as never, options());

        expect(ctx.fills).toEqual([]);
    });

    it('bands nothing on a chart with no rows in it', () => {
        const ctx = spyContext();

        barChartActiveRowPlugin.beforeDatasetsDraw?.(
            chartWith({ ctx, rows: 0, active: [{ datasetIndex: 0, index: 0 } as ActiveElement] }),
            {} as never,
            options()
        );

        expect(ctx.fills).toEqual([]);
    });

    it('bands nothing while a chart is still waiting on its data', () => {
        const ctx = spyContext();

        barChartActiveRowPlugin.beforeDatasetsDraw?.(
            chartWith({ ctx, active: [{ datasetIndex: 0, index: 1 } as ActiveElement] }),
            {} as never,
            options({ enabled: false })
        );

        expect(ctx.fills).toEqual([]);
    });

    it('leaves a chart that never asked for a band alone, since every chart is handed to it', () => {
        const ctx = spyContext();

        expect(() =>
            barChartActiveRowPlugin.beforeDatasetsDraw?.(
                chartWith({ ctx, active: [{ datasetIndex: 0, index: 1 } as ActiveElement] }),
                {} as never,
                {} as BarChartActiveRowOptions
            )
        ).not.toThrow();
        expect(ctx.fills).toEqual([]);
    });

    it('hands back the context as it found it', () => {
        const ctx = spyContext();

        barChartActiveRowPlugin.beforeDatasetsDraw?.(
            chartWith({ ctx, active: [{ datasetIndex: 0, index: 1 } as ActiveElement] }),
            {} as never,
            options()
        );

        expect(ctx.depth).toBe(0);
    });
});
