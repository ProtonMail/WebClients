import {
    applyProtonChartPolish,
    applyProtonMarkColors,
    applyResponsiveChartLayout,
    getProtonVegaConfig,
    PROTON_BAR_COLOR,
    PROTON_CATEGORY_COLORS,
    PROTON_LINE_COLOR,
    PROTON_PURPLE,
    stripHardcodedChartColors,
} from './protonVegaTheme';

describe('protonVegaTheme', () => {
    it('uses the Proton chart palette from the design reference', () => {
        expect(PROTON_CATEGORY_COLORS).toEqual([
            '#6D4AFF',
            '#34C77B',
            '#4F8EF7',
            '#F26B4D',
            '#C494FF',
            '#A0B4C8',
            '#F2B84B',
            '#43239B',
        ]);
    });

    it('builds a config with Proton purple marks and clean axes', () => {
        const config = getProtonVegaConfig();

        expect((config.range?.category as string[] | undefined)?.[0]).toBe(PROTON_PURPLE);
        expect(config.background).toBe('transparent');
        expect(config.line?.color).toBe(PROTON_LINE_COLOR);
        expect(config.line?.strokeWidth).toBe(2.25);
        expect(config.bar?.color).toBe(PROTON_BAR_COLOR);
        expect(config.bar?.cornerRadiusEnd).toBe(3);
        expect(config.area?.color).toBe(PROTON_PURPLE);
        expect(config.area?.opacity).toBe(0.18);
        expect(config.axis?.gridColor).toBe('#EDE9F7');
        expect(config.axis?.domainColor).toBe('#DAD3EF');
        expect(config.axisX?.grid).toBe(false);
        expect(config.axisY?.domain).toBe(false);
        expect(config.view?.stroke).toBe('transparent');
        expect(config.title?.fontSize).toBe(14);
        expect(config.title?.subtitleFontSize).toBe(11.5);
        expect(config.title?.subtitleColor).toBe('#6A6580');
    });

    it('strips hardcoded color channels from LLM specs', () => {
        const spec: Record<string, unknown> = {
            layer: [
                {
                    mark: 'line',
                    encoding: {
                        x: { field: 'month', type: 'ordinal' },
                        y: { field: 'temperature', type: 'quantitative' },
                        color: { value: '#e45756' },
                    },
                },
                {
                    mark: { type: 'bar', color: '#4c78a8' },
                    encoding: {
                        x: { field: 'month', type: 'ordinal' },
                        y: { field: 'precipitation', type: 'quantitative' },
                        color: { value: '#72b7b2' },
                    },
                },
            ],
            config: {
                range: { category: ['#ff0000'] },
            },
        };

        stripHardcodedChartColors(spec);

        const lineLayer = (spec.layer as Record<string, unknown>[])[0]!;
        const barLayer = (spec.layer as Record<string, unknown>[])[1]!;
        expect((lineLayer.encoding as Record<string, unknown>).color).toBeUndefined();
        expect((barLayer.encoding as Record<string, unknown>).color).toBeUndefined();
        expect((barLayer.mark as Record<string, unknown>).color).toBeUndefined();
        expect((spec.config as Record<string, unknown>).range).toBeUndefined();
    });

    it('preserves param-driven condition color encodings used for selections', () => {
        const spec: Record<string, unknown> = {
            encoding: {
                color: {
                    condition: {
                        param: 'brush',
                        field: 'weather',
                        type: 'nominal',
                        scale: { range: ['#ff0000', '#00ff00'] },
                    },
                    value: 'lightgray',
                },
            },
        };

        stripHardcodedChartColors(spec);

        expect((spec.encoding as Record<string, unknown>).color).toEqual({
            condition: {
                param: 'brush',
                field: 'weather',
                type: 'nominal',
                scale: {},
            },
            value: 'lightgray',
        });
    });

    it('polishes secondary y-axes to hide grid lines', () => {
        const spec: Record<string, unknown> = {
            layer: [
                {
                    encoding: {
                        y: {
                            field: 'precipitation',
                            type: 'quantitative',
                            axis: { orient: 'right', title: 'mm' },
                        },
                    },
                },
            ],
        };

        applyProtonChartPolish(spec);

        const yAxis = ((spec.layer as Record<string, unknown>[])[0]!.encoding as Record<string, unknown>).y as Record<
            string,
            unknown
        >;
        expect((yAxis.axis as Record<string, unknown>).grid).toBe(false);
    });

    it('polishes chart titles and merges top-level subtitles', () => {
        const spec: Record<string, unknown> = {
            title: 'Weekly active users',
            subtitle: 'DAU rose 22% MoM with no holiday dip',
            encoding: {
                x: { field: 'week', type: 'ordinal' },
                y: { field: 'dau', type: 'quantitative' },
            },
        };

        applyProtonChartPolish(spec);

        expect(spec.title).toEqual({
            text: 'Weekly active users',
            subtitle: 'DAU rose 22% MoM with no holiday dip',
            anchor: 'start',
            offset: 8,
            fontSize: 14,
            fontWeight: 600,
            subtitleFontSize: 11.5,
            subtitleFontWeight: 400,
            subtitleLineHeight: 16,
            subtitlePadding: 4,
        });
        expect(spec.subtitle).toBeUndefined();
    });

    it('preserves field-driven color encodings', () => {
        const spec: Record<string, unknown> = {
            encoding: {
                color: { field: 'series', type: 'nominal' },
            },
        };

        stripHardcodedChartColors(spec);

        expect((spec.encoding as Record<string, unknown>).color).toEqual({
            field: 'series',
            type: 'nominal',
        });
    });

    it('applies Proton colours to vconcat subcharts', () => {
        const spec: Record<string, unknown> = {
            vconcat: [
                {
                    mark: { type: 'bar', color: '#4c78a8' },
                    encoding: {
                        x: { field: 'month', type: 'ordinal' },
                        y: { field: 'precip', type: 'quantitative' },
                    },
                },
                {
                    mark: { type: 'line', color: '#e45756' },
                    encoding: {
                        x: { field: 'month', type: 'ordinal' },
                        y: { field: 'temp', type: 'quantitative' },
                    },
                },
                {
                    mark: { type: 'area', color: '#fbbf24' },
                    encoding: {
                        x: { field: 'month', type: 'ordinal' },
                        y: { field: 'sunshine', type: 'quantitative' },
                    },
                },
            ],
        };

        stripHardcodedChartColors(spec);
        applyProtonMarkColors(spec);

        const charts = spec.vconcat as Record<string, unknown>[];
        expect((charts[0]!.mark as Record<string, unknown>).color).toBe(PROTON_BAR_COLOR);
        expect((charts[1]!.mark as Record<string, unknown>).color).toBe(PROTON_LINE_COLOR);
        expect((charts[2]!.mark as Record<string, unknown>).color).toBe(PROTON_PURPLE);
        expect((charts[2]!.mark as Record<string, unknown>).opacity).toBe(0.18);
    });

    it('uses a perceptually linear ramp for quantitative color encodings', () => {
        const spec: Record<string, unknown> = {
            mark: 'rect',
            encoding: {
                x: { field: 'day', type: 'ordinal' },
                y: { field: 'hour', type: 'ordinal' },
                color: { field: 'rate', type: 'quantitative' },
            },
        };

        applyProtonMarkColors(spec);

        const color = (spec.encoding as Record<string, unknown>).color as Record<string, unknown>;
        expect(color.scale).toMatchObject({
            range: expect.arrayContaining(['#F8F1FF', '#43239B']),
        });
        expect((color.scale as Record<string, unknown>).scheme).toBeUndefined();
    });

    it('does not set width on layer children', () => {
        const spec: Record<string, unknown> = {
            layer: [
                {
                    mark: 'line',
                    encoding: {
                        x: { field: 'day', type: 'quantitative' },
                        y: { field: 'value', type: 'quantitative' },
                    },
                },
            ],
        };

        applyResponsiveChartLayout(spec);

        const layers = spec.layer as Record<string, unknown>[];
        expect(spec.width).toBe('container');
        expect(layers[0]?.width).toBeUndefined();
        expect(spec.autosize).toEqual({ type: 'fit-x', contains: 'padding' });
    });

    it('applies semantic product colours when color encodes product', () => {
        const spec: Record<string, unknown> = {
            mark: 'bar',
            data: {
                values: [
                    { product: 'Mail', sessions: 920 },
                    { product: 'Lumo', sessions: 48 },
                ],
            },
            encoding: {
                x: { field: 'week', type: 'ordinal' },
                y: { field: 'sessions', type: 'quantitative' },
                color: { field: 'product', type: 'nominal' },
            },
        };

        applyProtonMarkColors(spec);

        const color = (spec.encoding as Record<string, unknown>).color as Record<string, unknown>;
        expect((color.scale as Record<string, unknown>).domain).toEqual(['Mail', 'Lumo', 'VPN', 'Calendar', 'Drive']);
        expect((color.scale as Record<string, unknown>).range).toEqual([
            '#6D4AFF',
            '#A780FF',
            '#34C77B',
            '#4F8EF7',
            '#F26B4D',
        ]);
    });

    it('uses categorical colours when route field encodes API paths, not Proton products', () => {
        const spec: Record<string, unknown> = {
            mark: 'bar',
            data: {
                values: [
                    { route: '/v1/embed', errors: 42 },
                    { route: '/v1/chat', errors: 18 },
                ],
            },
            encoding: {
                x: { field: 'errors', type: 'quantitative' },
                y: { field: 'route', type: 'ordinal' },
                color: { field: 'route', type: 'nominal', legend: null },
            },
        };

        applyProtonMarkColors(spec);

        const color = (spec.encoding as Record<string, unknown>).color as Record<string, unknown>;
        expect((color.scale as Record<string, unknown>).domain).toBeUndefined();
        expect((color.scale as Record<string, unknown>).range).toEqual([
            '#6D4AFF',
            '#34C77B',
            '#4F8EF7',
            '#F26B4D',
            '#C494FF',
            '#A0B4C8',
            '#F2B84B',
            '#43239B',
        ]);
    });

    it('uses readable ink and legend colors in dark mode', () => {
        const darkTheme = document.createElement('style');
        darkTheme.id = 'lumo-dark-theme';
        document.head.appendChild(darkTheme);

        try {
            const config = getProtonVegaConfig();

            expect(config.title?.color).toBe('#FFFFFF');
            expect(config.legend?.labelColor).toBe('#ADABA9');
            expect(config.text?.color).toBe('#ADABA9');
            expect(config.range?.ramp).toEqual(['#2A2440', '#4A3878', '#6D4AFF', '#A780FF', '#DAC7FF']);
            expect(config.arc?.stroke).toBe('#1C1B22');
        } finally {
            darkTheme.remove();
        }
    });
});
