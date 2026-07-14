import { normalizeArcDonutCharts, normalizeLayeredChartUnits, normalizeVegaLiteSpec, normalizeInvalidD3Formats, normalizeStoredPercentFormats, normalizeTestBasedColorEncoding, splitDualAxisCharts } from './normalizeVegaLiteSpec';
import { applyResponsiveChartLayout } from './protonVegaTheme';

describe('normalizeVegaLiteSpec', () => {
    it('combines same-unit series on one chart when inferring from values', () => {
        const normalized = normalizeVegaLiteSpec({
            data: {
                values: [
                    { month: 'Jan', avg_temp: 1, max_temp: 5, min_temp: -1 },
                    { month: 'Feb', avg_temp: 3, max_temp: 8, min_temp: 0 },
                ],
            },
        });

        expect(normalized.vconcat).toBeUndefined();
        expect(normalized.transform).toBeDefined();
        expect(normalized.mark).toBe('line');
    });

    it('infers stacked charts from weather-like values without mark/encoding', () => {
        const normalized = normalizeVegaLiteSpec({
            $schema: 'https://vega-lang.org/schema/v5',
            title: 'Geneva weather',
            subtitle: 'Sample data',
            width: 600,
            height: 400,
            data: {
                values: [
                    { month: 'Jan', avg_temp: 1, max_temp: 5, min_temp: -1, precipitation: 80 },
                    { month: 'Feb', avg_temp: 3, max_temp: 8, min_temp: 0, precipitation: 70 },
                ],
            },
        });

        expect(normalized.$schema).toBe('https://vega.github.io/schema/vega-lite/v5.json');
        expect(normalized.vconcat).toBeDefined();
        expect(normalized.layer).toBeUndefined();
        expect(normalized.title).toEqual({ text: 'Geneva weather', subtitle: 'Sample data' });
        expect(normalized.subtitle).toBeUndefined();
    });

    it('coerces string titles into title objects', () => {
        const normalized = normalizeVegaLiteSpec({
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            title: 'Latency distribution',
            data: { values: [{ tier: 'nano', latency: 88 }] },
            mark: 'bar',
            encoding: {
                x: { field: 'tier', type: 'ordinal' },
                y: { field: 'latency', type: 'quantitative' },
            },
        });

        expect(normalized.title).toEqual({ text: 'Latency distribution', anchor: 'start' });
    });

    it('infers encoding when the model emits mark without encoding', () => {
        const normalized = normalizeVegaLiteSpec({
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            title: {
                text: 'Geneva Weather — Monthly Climate Overview',
                subtitle: 'Average temperature, precipitation, and sunshine hours',
                fontSize: 18,
                anchor: 'start',
            },
            mark: 'line',
            data: {
                values: [
                    { month: 'Jan', month_num: 1, temperature: 3, precipitation: 76, sunshine: 55 },
                    { month: 'Feb', month_num: 2, temperature: 4, precipitation: 68, sunshine: 80 },
                ],
            },
        });

        expect(normalized.vconcat ?? normalized.encoding).toBeDefined();
        expect(normalized.mark).toBeUndefined();
        expect(normalized.resolve).toBeUndefined();
    });

    it('removes empty layer placeholders and inherits x/y for highlight overlays', () => {
        const normalized = normalizeVegaLiteSpec({
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            width: 'container',
            title: { text: 'API Error Rate by Hour (UTC)', subtitle: 'Spike at 14-15h' },
            data: {
                values: [
                    { hour: 13, rate: 0.49 },
                    { hour: 14, rate: 1.34 },
                    { hour: 15, rate: 1.28 },
                ],
            },
            mark: { type: 'line', point: true, interpolate: 'monotone' },
            encoding: {
                x: { field: 'hour', type: 'ordinal', axis: { title: 'Hour (UTC)' } },
                y: { field: 'rate', type: 'quantitative', axis: { title: 'Error rate (%)' } },
                color: { field: 'rate', type: 'quantitative', legend: null },
            },
            layer: [
                {},
                {
                    transform: [{ filter: 'datum.hour >= 14 && datum.hour <= 15' }],
                    mark: { type: 'area', opacity: 0.3 },
                },
            ],
        });

        const layers = normalized.layer as Record<string, unknown>[];
        const areaLayer = layers[1]!;
        const areaEncoding = areaLayer.encoding as Record<string, unknown>;

        expect(layers).toHaveLength(2);
        expect(layers.every((layer) => Object.keys(layer).length > 0)).toBe(true);
        expect(areaEncoding.x).toMatchObject({ field: 'hour', type: 'ordinal' });
        expect(areaEncoding.y).toMatchObject({ field: 'rate', type: 'quantitative' });
    });

    it('strips empty layer entries from layer-only specs', () => {
        const spec: Record<string, unknown> = {
            layer: [
                {
                    mark: 'line',
                    encoding: {
                        x: { field: 'hour', type: 'ordinal' },
                        y: { field: 'rate', type: 'quantitative' },
                    },
                },
                {},
            ],
        };

        normalizeLayeredChartUnits(spec);

        expect((spec.layer as Record<string, unknown>[]).length).toBe(1);
    });

    it('splits dual-axis layered specs into vconcat', () => {
        const normalized = splitDualAxisCharts({
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            title: 'Weather',
            data: {
                values: [{ month: 'Jan', temp: 3, precip: 76 }],
            },
            layer: [
                {
                    mark: 'line',
                    encoding: {
                        x: { field: 'month', type: 'ordinal' },
                        y: { field: 'temp', type: 'quantitative', title: 'Temp (°C)' },
                    },
                },
                {
                    mark: 'bar',
                    encoding: {
                        x: { field: 'month', type: 'ordinal' },
                        y: {
                            field: 'precip',
                            type: 'quantitative',
                            title: 'Precip (mm)',
                            axis: { orient: 'right' },
                        },
                    },
                },
            ],
            resolve: { scale: { y: 'independent' } },
        });

        expect(normalized.vconcat).toHaveLength(2);
        expect(normalized.layer).toBeUndefined();
        expect(normalized.resolve).toBeUndefined();
    });

    it('preserves explicit mark/encoding', () => {
        const normalized = normalizeVegaLiteSpec({
            mark: 'point',
            encoding: {
                x: { field: 'x', type: 'quantitative' },
            },
        });

        expect(normalized.mark).toBe('point');
        expect(normalized.encoding).toEqual({
            x: { field: 'x', type: 'quantitative' },
        });
    });

    it('strips invalid full-Vega marks and infers Vega-Lite from inline data', () => {
        const normalized = normalizeVegaLiteSpec({
            data: {
                values: [
                    { month: 'Jan', avg_temp: 1, precipitation: 80 },
                    { month: 'Feb', avg_temp: 3, precipitation: 70 },
                ],
            },
            marks: [
                {
                    type: 'line',
                    from: { data: 'marks' },
                    encode: {
                        x: { field: 'month', type: 'ordinal' },
                        y: { field: 'avg_temp', type: 'quantitative' },
                    },
                },
            ],
        });

        expect(normalized.marks).toBeUndefined();
        expect(normalized.vconcat ?? normalized.mark).toBeDefined();
    });

    it('strips orphan param filters from single-panel specs', () => {
        const normalized = normalizeVegaLiteSpec({
            mark: 'bar',
            transform: [{ filter: { param: 'brush' } }],
            encoding: {
                x: { aggregate: 'count' },
                y: { field: 'weather', type: 'nominal' },
            },
        });

        expect(normalized.transform).toBeUndefined();
    });

    it('keeps param-driven filters visible when the selection is empty on linked views', () => {
        const normalized = normalizeVegaLiteSpec({
            params: [{ name: 'brush', select: { type: 'interval', encodings: ['x'] } }],
            vconcat: [
                {
                    mark: 'point',
                    encoding: {
                        x: { field: 'month', type: 'ordinal' },
                        y: { field: 'temperature', type: 'quantitative' },
                    },
                },
                {
                    mark: 'bar',
                    transform: [{ filter: { param: 'brush' } }],
                    encoding: {
                        x: { aggregate: 'count' },
                        y: { field: 'weather', type: 'nominal' },
                    },
                },
            ],
        });

        const bottomTransform = (normalized.vconcat as Record<string, unknown>[])[1]?.transform as Record<
            string,
            unknown
        >[];
        expect(bottomTransform[0]?.filter).toEqual({ param: 'brush', empty: true });
    });

    it('hoists child selection params to the vconcat root for linked views', () => {
        const normalized = normalizeVegaLiteSpec({
            vconcat: [
                {
                    mark: 'point',
                    params: [{ name: 'brush', select: { type: 'interval', encodings: ['x'] } }],
                    encoding: {
                        x: { field: 'month', type: 'ordinal' },
                        y: { field: 'temperature', type: 'quantitative' },
                    },
                },
                {
                    mark: 'bar',
                    transform: [{ filter: { param: 'brush' } }],
                    encoding: {
                        x: { field: 'month', type: 'ordinal' },
                        y: { field: 'rainfall', type: 'quantitative' },
                    },
                },
            ],
        });

        expect(normalized.params).toEqual([{ name: 'brush', select: { type: 'interval', encodings: ['x'] } }]);
        expect((normalized.vconcat as Record<string, unknown>[])[0]?.params).toBeUndefined();
    });

    it('strips accidental interactivity from 3-panel static vconcat charts', () => {
        const normalized = normalizeVegaLiteSpec({
            vconcat: [
                {
                    mark: 'line',
                    params: [{ name: 'brush', select: { type: 'interval', encodings: ['x'] } }],
                    encoding: {
                        x: { field: 'month', type: 'ordinal' },
                        y: { field: 'temperature', type: 'quantitative' },
                        color: {
                            condition: { param: 'brush', field: 'month', type: 'nominal' },
                            value: 'lightgray',
                        },
                    },
                },
                {
                    mark: 'bar',
                    transform: [{ filter: { param: 'brush' } }],
                    encoding: {
                        x: { field: 'month', type: 'ordinal' },
                        y: { field: 'rainfall', type: 'quantitative' },
                    },
                },
                {
                    mark: 'line',
                    transform: [{ filter: { param: 'brush' } }],
                    encoding: {
                        x: { field: 'month', type: 'ordinal' },
                        y: { field: 'sunshine', type: 'quantitative' },
                    },
                },
            ],
        });

        expect(normalized.params).toBeUndefined();
        const panels = normalized.vconcat as Record<string, unknown>[];
        expect(panels[0]?.transform).toBeUndefined();
        expect(panels[1]?.transform).toBeUndefined();
        expect(panels[2]?.transform).toBeUndefined();
        expect((panels[0]?.encoding as Record<string, unknown>).color).toEqual({
            field: 'month',
            type: 'nominal',
        });
    });

    it('converts one-dimensional rect heatmaps to bar charts', () => {
        const normalized = normalizeVegaLiteSpec({
            mark: 'rect',
            data: {
                values: [
                    { hour: 0, error_rate: 0.4 },
                    { hour: 3, error_rate: 1.3 },
                ],
            },
            encoding: {
                x: { field: 'hour', type: 'ordinal', title: 'Hour (UTC)' },
                y: { field: 'hour', type: 'quantitative' },
                color: { field: 'error_rate', type: 'quantitative', title: 'Error rate' },
            },
        });

        expect(normalized.mark).toMatchObject({ type: 'bar' });
        expect((normalized.encoding as Record<string, unknown>).y).toMatchObject({
            field: 'error_rate',
            type: 'quantitative',
        });
        expect((normalized.encoding as Record<string, unknown>).color).toBeUndefined();
    });

    it('hoists root arc mark into layer when LLMs add a label layer alongside unit spec', () => {
        const normalized = normalizeVegaLiteSpec({
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            width: 'container',
            data: {
                values: [
                    { method: 'Password', users: 41 },
                    { method: 'SSO', users: 29 },
                ],
            },
            mark: { type: 'arc', outerRadius: 100, innerRadius: 50 },
            encoding: {
                theta: { field: 'users', type: 'quantitative' },
                color: { field: 'method', type: 'nominal', legend: null },
            },
            layer: [
                {
                    mark: { type: 'text', radius: 70 },
                    encoding: { text: { field: 'users', format: '%d%%' } },
                },
            ],
        });

        expect(normalized.mark).toBeUndefined();
        expect(normalized.encoding).toBeUndefined();
        const layers = normalized.layer as Record<string, unknown>[];
        expect(layers).toHaveLength(2);
        expect(getMarkTypeFromLayer(layers[0]!)).toBe('arc');
        expect(getMarkTypeFromLayer(layers[1]!)).toBe('text');
        expect((layers[1]!.encoding as Record<string, unknown>).theta).toMatchObject({
            field: 'users',
            type: 'quantitative',
        });
    });

    it('rewrites datum test color conditions into a precomputed nominal band field', () => {
        const spec: Record<string, unknown> = {
            data: {
                values: [
                    { hour: 0, error_rate: 0.4 },
                    { hour: 3, error_rate: 1.3 },
                ],
            },
            mark: 'bar',
            encoding: {
                x: { field: 'hour', type: 'ordinal' },
                y: { field: 'error_rate', type: 'quantitative' },
                color: {
                    condition: { test: 'datum.error_rate > 0.8', value: '#ff6b6b' },
                    value: '#6d4aff',
                },
            },
        };

        normalizeTestBasedColorEncoding(spec);

        const values = (spec.data as { values: Record<string, unknown>[] }).values;
        expect(values[0]?.__lumoColorBand).toBe('default');
        expect(values[1]?.__lumoColorBand).toBe('highlight');
        expect(spec.encoding).toMatchObject({
            color: {
                field: '__lumoColorBand',
                type: 'nominal',
                scale: {
                    domain: ['default', 'highlight'],
                    range: ['#6d4aff', '#ff6b6b'],
                },
            },
        });
    });

    it('rewrites percent multiplier formats when values are already stored as percent points', () => {
        const spec: Record<string, unknown> = {
            data: {
                values: [
                    { method: 'Password', users: 41 },
                    { method: 'SSO', users: 29 },
                ],
            },
            mark: 'arc',
            encoding: {
                theta: { field: 'users', type: 'quantitative' },
                color: { field: 'method', type: 'nominal' },
                tooltip: [
                    { field: 'method', type: 'nominal' },
                    { field: 'users', type: 'quantitative', format: '%' },
                ],
            },
        };

        normalizeStoredPercentFormats(spec);

        const tooltip = (spec.encoding as Record<string, unknown>).tooltip as Record<string, unknown>[];
        expect(tooltip[1]).toMatchObject({ field: 'users', format: '.0f', title: 'Users (%)' });
    });

    it('keeps percent multiplier formats for unit-fraction data', () => {
        const spec: Record<string, unknown> = {
            data: {
                values: [
                    { method: 'Password', share: 0.41 },
                    { method: 'SSO', share: 0.29 },
                    { method: 'OAuth', share: 0.19 },
                    { method: 'Other', share: 0.11 },
                ],
            },
            encoding: {
                tooltip: [{ field: 'share', type: 'quantitative', format: '%' }],
            },
        };

        normalizeStoredPercentFormats(spec);

        const tooltip = (spec.encoding as Record<string, unknown>).tooltip as Record<string, unknown>[];
        expect(tooltip[0]?.format).toBe('%');
    });

    it('rewrites percent formats on layer children using root inline data', () => {
        const spec: Record<string, unknown> = {
            data: {
                values: [
                    { product: 'Mail', growth_pct: 3 },
                    { product: 'Lumo', growth_pct: 22 },
                ],
            },
            layer: [
                { mark: 'bar', encoding: { x: { field: 'product', type: 'nominal' } } },
                {
                    mark: 'text',
                    encoding: {
                        text: { field: 'growth_pct', type: 'quantitative', format: '+d%' },
                    },
                },
            ],
        };

        normalizeStoredPercentFormats(spec);
        const textLayer = (spec.layer as Record<string, unknown>[])[1]!;
        const text = (textLayer.encoding as Record<string, unknown>).text as Record<string, unknown>;

        expect(text.format).toBe('+.0f');
    });

    it('rewrites Excel-style axis formats like :0 into valid d3 formats', () => {
        const spec: Record<string, unknown> = {
            mark: 'line',
            encoding: {
                x: { field: 'hour', type: 'quantitative', axis: { format: ':0' } },
                y: { field: 'error_rate', type: 'quantitative', axis: { format: '.1f' } },
                tooltip: [
                    { field: 'hour', type: 'quantitative', format: ':0' },
                    { field: 'error_rate', type: 'quantitative', format: '.1f' },
                ],
            },
        };

        normalizeInvalidD3Formats(spec);
        const encoding = spec.encoding as Record<string, unknown>;
        expect((encoding.x as Record<string, unknown>).axis).toMatchObject({ format: 'd' });
        expect((encoding.tooltip as Record<string, unknown>[])[0]).toMatchObject({ format: 'd' });
    });

    it('removes overlapping donut label layers and uses a bottom legend', () => {
        const spec: Record<string, unknown> = {
            width: 'container',
            layer: [
                {
                    mark: { type: 'arc', outerRadius: 80, innerRadius: 40 },
                    encoding: {
                        theta: { field: 'percent', type: 'quantitative' },
                        color: { field: 'method', type: 'nominal', legend: null },
                    },
                },
                {
                    mark: { type: 'text', radius: 60 },
                    encoding: {
                        theta: { field: 'centroid', type: 'quantitative' },
                        text: { field: 'label', type: 'nominal' },
                    },
                },
            ],
            data: {
                values: [
                    { method: 'Password', percent: 41, label: '41%', centroid: 180 },
                    { method: 'SSO', percent: 29, label: '29%', centroid: 308 },
                ],
            },
        };

        applyResponsiveChartLayout(spec);
        normalizeArcDonutCharts(spec);

        const layers = spec.layer as Record<string, unknown>[];
        const arcLayer = layers[0]!;
        const arcMark = arcLayer.mark as Record<string, unknown>;
        const arcEncoding = arcLayer.encoding as Record<string, unknown>;

        expect(spec.autosize).toEqual({ type: 'fit', contains: 'padding' });
        expect(spec.height).toBe(280);
        expect(layers).toHaveLength(1);
        expect(arcMark.outerRadius).toBeGreaterThan(80);
        expect(arcEncoding.color).toMatchObject({
            field: 'method',
            legend: {
                orient: 'bottom',
                direction: 'horizontal',
                title: null,
            },
        });
        expect(arcEncoding.tooltip).toEqual([
            { field: 'method', type: 'nominal' },
            { field: 'percent', type: 'quantitative', format: '.0f', title: 'Share (%)' },
        ]);
    });

    it('removes numeric share_pct text labels from donut charts', () => {
        const spec: Record<string, unknown> = {
            width: 'container',
            layer: [
                {
                    mark: { type: 'arc', outerRadius: 80, innerRadius: 40 },
                    encoding: {
                        theta: { field: 'share_pct', type: 'quantitative' },
                        color: { field: 'method', type: 'nominal' },
                    },
                },
                {
                    mark: { type: 'text', radius: 60, fontSize: 12 },
                    encoding: {
                        theta: { field: 'share_pct', type: 'quantitative' },
                        color: { field: 'method', type: 'nominal' },
                        text: { field: 'share_pct', type: 'quantitative', format: '.0f' },
                    },
                },
            ],
            data: {
                values: [
                    { method: 'Password', share_pct: 41 },
                    { method: 'SSO', share_pct: 29 },
                ],
            },
        };

        applyResponsiveChartLayout(spec);
        normalizeArcDonutCharts(spec);

        expect((spec.layer as Record<string, unknown>[]).length).toBe(1);
    });
});

function getMarkTypeFromLayer(layer: Record<string, unknown>): string | undefined {
    const mark = layer.mark;
    if (typeof mark === 'string') {
        return mark;
    }

    if (mark && typeof mark === 'object' && !Array.isArray(mark)) {
        return (mark as Record<string, unknown>).type as string | undefined;
    }

    return undefined;
}
