import type { ScriptableContext } from 'chart.js';

import { splitAtThreshold } from './splitAtThreshold';

const BELOW = '#6d4aff';
const ABOVE = '#dc3251';

const gradientSpy = () => {
    const stops: [number, string][] = [];

    return {
        stops,
        createLinearGradient: () => ({
            addColorStop: (offset: number, color: string) => stops.push([offset, color]),
        }),
    };
};

const context = ({
    ctx = gradientSpy(),
    top = 0,
    bottom = 100,
    scales = { y: { getPixelForValue: (value: number) => 100 - value } },
}: {
    ctx?: unknown;
    top?: number;
    bottom?: number;
    scales?: unknown;
} = {}) =>
    ({
        chart: { ctx, chartArea: { top, bottom }, scales },
    }) as unknown as ScriptableContext<'line'>;

const split = (threshold: number | undefined) => splitAtThreshold(threshold, BELOW, ABOVE);

describe('splitAtThreshold', () => {
    it('meets the two colours at the threshold, with no fade between them', () => {
        const ctx = gradientSpy();

        split(80)(context({ ctx }));

        expect(ctx.stops).toEqual([
            [0, ABOVE],
            [0.2, ABOVE],
            [0.2, BELOW],
            [1, BELOW],
        ]);
    });

    it('places the boundary where the value lands, not where the value is', () => {
        const ctx = gradientSpy();

        split(30)(context({ ctx, top: 40, bottom: 140 }));

        expect(ctx.stops.map(([offset]) => offset)).toEqual([0, 0.3, 0.3, 1]);
    });

    it('paints one colour for a threshold above everything the axis reaches', () => {
        const ctx = gradientSpy();

        split(400)(context({ ctx }));

        expect(ctx.stops).toEqual([
            [0, ABOVE],
            [0, ABOVE],
            [0, BELOW],
            [1, BELOW],
        ]);
    });

    it('paints one colour for a threshold below everything the axis reaches', () => {
        const ctx = gradientSpy();

        split(-400)(context({ ctx }));

        expect(ctx.stops).toEqual([
            [0, ABOVE],
            [1, ABOVE],
            [1, BELOW],
            [1, BELOW],
        ]);
    });

    it('is the colour under the rule when there is no rule', () => {
        expect(split(undefined)(context())).toBe(BELOW);
    });

    it('is a flat colour before the plot has been laid out', () => {
        const before = { chart: { ctx: gradientSpy(), chartArea: undefined, scales: {} } };

        expect(split(80)(before as unknown as ScriptableContext<'line'>)).toBe(BELOW);
    });

    it('is a flat colour on a chart with no value axis', () => {
        expect(split(80)(context({ scales: {} }))).toBe(BELOW);
    });

    it('is a flat colour in a plot with no height', () => {
        expect(split(80)(context({ top: 100, bottom: 100 }))).toBe(BELOW);
    });
});
