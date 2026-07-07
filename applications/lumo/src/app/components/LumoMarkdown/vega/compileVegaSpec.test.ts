import { compile } from 'vega-lite';

import { sanitizeVegaSpec } from './sanitizeVegaSpec';

const boxData = ['nano', 'micro', 'standard', 'large'].flatMap((tier) =>
    Array.from({ length: 20 }, (_, i) => ({
        tier,
        call_id: i + 1,
        latency: { nano: 80, micro: 130, standard: 210, large: 380 }[tier]! + (Math.random() - 0.5) * 40,
    }))
);

describe('compileVegaSpec', () => {
    it('compiles a layered boxplot + jitter spec after sanitization', () => {
        const raw = JSON.stringify({
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            width: 'container',
            autosize: { type: 'pad', contains: 'padding' },
            data: { values: boxData },
            layer: [
                {
                    mark: { type: 'boxplot', extent: 1.5 },
                    encoding: {
                        x: { field: 'tier', type: 'ordinal', title: null },
                        y: { field: 'latency', type: 'quantitative', title: 'Latency (ms)' },
                        color: { field: 'tier', type: 'nominal', legend: null },
                    },
                },
                {
                    mark: { type: 'point', filled: true, opacity: 0.35, size: 30 },
                    encoding: {
                        x: { field: 'tier', type: 'ordinal' },
                        y: { field: 'latency', type: 'quantitative' },
                        xOffset: { field: 'latency', type: 'quantitative', scale: { range: [-8, 8] } },
                    },
                },
            ],
        });

        const spec = sanitizeVegaSpec(raw);
        expect((spec as Record<string, unknown>).layer).toBeDefined();
        const layers = (spec as Record<string, unknown>).layer as Record<string, unknown>[];
        expect(layers[0]?.width).toBeUndefined();
        expect(layers[0]?.height).toBeUndefined();
        expect((spec as Record<string, unknown>).autosize).toEqual({ type: 'fit-x', contains: 'padding' });
        expect(() => compile(spec)).not.toThrow();
    });

    it('compiles inferred charts from tier/latency inline data', () => {
        const raw = JSON.stringify({
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            width: 'container',
            data: { values: boxData },
        });

        const spec = sanitizeVegaSpec(raw);
        expect(() => compile(spec)).not.toThrow();
    });

    it('compiles linked brush selection specs after sanitization', () => {
        const weather = [
            { date: '2012-01-01', temp_max: 8, weather: 'rain' },
            { date: '2012-01-02', temp_max: 10, weather: 'sun' },
            { date: '2012-02-01', temp_max: 12, weather: 'fog' },
            { date: '2012-02-02', temp_max: 9, weather: 'rain' },
        ];

        const raw = JSON.stringify({
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            width: 'container',
            title: {
                text: 'Weather overview',
                subtitle: 'Brush the timeline to filter the breakdown below',
            },
            data: { values: weather },
            vconcat: [
                {
                    width: 'container',
                    mark: 'point',
                    params: [{ name: 'brush', select: { type: 'interval', encodings: ['x'] } }],
                    encoding: {
                        x: { field: 'date', type: 'temporal', title: 'Date' },
                        y: { field: 'temp_max', type: 'quantitative', title: 'Max temp (C)' },
                        color: {
                            condition: { param: 'brush', field: 'weather', type: 'nominal' },
                            value: 'lightgray',
                        },
                    },
                },
                {
                    width: 'container',
                    mark: 'bar',
                    transform: [{ filter: { param: 'brush' } }],
                    encoding: {
                        y: { field: 'weather', type: 'nominal', title: 'Weather' },
                        x: { aggregate: 'count' },
                    },
                },
            ],
        });

        const spec = sanitizeVegaSpec(raw);
        expect(spec.params).toEqual([{ name: 'brush', select: { type: 'interval', encodings: ['x'] } }]);
        const colorEncoding = (
            (spec as Record<string, unknown>).vconcat as Record<string, unknown>[]
        )[0]?.encoding as Record<string, unknown>;
        expect(colorEncoding.color).toMatchObject({
            condition: { param: 'brush', field: 'weather', type: 'nominal' },
            value: 'lightgray',
        });
        const bottomTransform = (
            (spec as Record<string, unknown>).vconcat as Record<string, unknown>[]
        )[1]?.transform as Record<string, unknown>[];
        expect(bottomTransform[0]?.filter).toMatchObject({ param: 'brush', empty: true });
        expect(() => compile(spec)).not.toThrow();
    });

    it('compiles a dual-series climate layer chart after sanitization', () => {
        const raw = JSON.stringify({
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            width: 'container',
            title: {
                text: 'Geneva monthly temperature & sunshine',
                subtitle: 'Both peak in July (24 °C, 248 h)',
            },
            data: {
                values: [
                    { month: 'Jan', temperature: 3, sunshine: 55 },
                    { month: 'Jul', temperature: 24, sunshine: 248 },
                ],
            },
            transform: [{ fold: ['temperature', 'sunshine'], as: ['series', 'value'] }],
            mark: { type: 'line', interpolate: 'monotone' },
            encoding: {
                x: { field: 'month', type: 'ordinal', title: 'Month' },
                y: { field: 'value', type: 'quantitative', title: 'Value' },
                color: { field: 'series', type: 'nominal', title: 'Series' },
            },
        });

        const spec = sanitizeVegaSpec(raw);
        expect((spec as Record<string, unknown>).autosize).toEqual({ type: 'fit-x', contains: 'padding' });
        expect(() => compile(spec)).not.toThrow();
    });

    it('does not add a stray top-level mark to vconcat climate dashboards', () => {
        const raw = JSON.stringify({
            title: {
                text: 'Geneva Climate Summary: Temperature, Rainfall & Sunshine',
                subtitle: '12-month averages',
            },
            width: 'container',
            data: {
                values: [
                    { month: 'Jan', temp: -1, rain: 42, sun: 68 },
                    { month: 'Jul', temp: 24, rain: 58, sun: 248 },
                ],
            },
            vconcat: [
                {
                    title: { text: 'Monthly Average Temperature', subtitle: 'Peaks in July' },
                    mark: { type: 'line', point: true, interpolate: 'monotone' },
                    encoding: {
                        x: { field: 'month', type: 'ordinal' },
                        y: { field: 'temp', type: 'quantitative', title: 'Temp (°C)' },
                        color: { value: '#6d4aff' },
                    },
                },
                {
                    title: { text: 'Monthly Rainfall', subtitle: 'Highest in June' },
                    mark: { type: 'bar', cornerRadiusEnd: 3 },
                    encoding: {
                        x: { field: 'month', type: 'ordinal' },
                        y: { field: 'rain', type: 'quantitative', title: 'Rainfall (mm)' },
                        color: { field: 'month', type: 'nominal', scale: { scheme: 'blues' } },
                    },
                },
                {
                    title: { text: 'Monthly Sunshine Hours', subtitle: 'Maximum in July' },
                    mark: { type: 'area', interpolate: 'monotone', opacity: 0.6 },
                    encoding: {
                        x: { field: 'month', type: 'ordinal' },
                        y: { field: 'sun', type: 'quantitative', title: 'Sunshine (hours)' },
                        color: { value: '#FFD700' },
                    },
                },
            ],
        });

        const spec = sanitizeVegaSpec(raw) as Record<string, unknown>;

        expect(spec.mark).toBeUndefined();
        expect(spec.encoding).toBeUndefined();
        expect(spec.vconcat).toHaveLength(3);
        expect(() => compile(spec)).not.toThrow();
    });

    it('preserves shared encoding on layered panels inside vconcat', () => {
        const layerPanel = (field: string, title: string) => ({
            title: { text: title, subtitle: 'Seasonal pattern' },
            width: 'container',
            data: {
                values: [
                    { month: 'Jan', [field]: 1 },
                    { month: 'Jul', [field]: 24 },
                ],
            },
            layer: [
                { mark: { type: 'area', interpolate: 'monotone', opacity: 0.15 } },
                { mark: { type: 'line', interpolate: 'monotone', strokeWidth: 3 } },
                { mark: { type: 'point', filled: true, size: 60 } },
            ],
            encoding: {
                x: { field: 'month', type: 'ordinal', title: null },
                y: { field, type: 'quantitative', title },
            },
        });

        const raw = JSON.stringify({
            title: { text: 'Geneva Climate', subtitle: 'Last 12 months' },
            vconcat: [layerPanel('temp', 'Temp (°C)'), layerPanel('sun', 'Sunshine (h)')],
        });

        const spec = sanitizeVegaSpec(raw) as Record<string, unknown>;
        const panels = spec.vconcat as Record<string, unknown>[];

        expect(panels[0]?.encoding).toMatchObject({
            x: { field: 'month', type: 'ordinal' },
            y: { field: 'temp', type: 'quantitative' },
        });
        expect(panels[1]?.encoding).toMatchObject({
            y: { field: 'sun', type: 'quantitative' },
        });
        expect(() => compile(spec)).not.toThrow();
    });

    it('compiles donut charts when arc mark and label layer were emitted at the same level', () => {
        const raw = JSON.stringify({
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            width: 'container',
            title: { text: 'Lumo Auth Methods', subtitle: 'Password still dominant at 41%' },
            data: {
                values: [
                    { method: 'Password', users: 41 },
                    { method: 'SSO', users: 29 },
                    { method: 'OAuth', users: 19 },
                    { method: 'Passkey', users: 8 },
                    { method: 'Other', users: 3 },
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

        const spec = sanitizeVegaSpec(raw);
        const compiled = compile(spec);
        const markTypes = (compiled.spec as { marks?: { type?: string }[] }).marks?.map((mark) => mark.type);

        expect(markTypes).toContain('arc');
        expect(markTypes).toContain('text');
    });

    it('compiles hourly error bars with datum test highlight colors after sanitization', () => {
        const raw = JSON.stringify({
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            width: 'container',
            title: { text: 'API Error Rate by Hour', subtitle: 'Peak 1.3% at 03:00 UTC' },
            data: {
                values: Array.from({ length: 24 }, (_, hour) => ({ hour, error_rate: hour === 3 ? 1.3 : 0.4 })),
            },
            mark: { type: 'bar', cornerRadius: 2 },
            encoding: {
                x: { field: 'hour', type: 'ordinal', title: 'Hour UTC' },
                y: { field: 'error_rate', type: 'quantitative', axis: { title: 'Error Rate (%)' } },
                color: {
                    condition: { test: 'datum.error_rate > 0.8', value: '#ff6b6b' },
                    value: '#6d4aff',
                },
            },
        });

        const spec = sanitizeVegaSpec(raw) as Record<string, unknown>;
        const color = (spec.encoding as Record<string, unknown>).color as Record<string, unknown>;

        expect(color.field).toBe('__lumoColorBand');
        expect(color.condition).toBeUndefined();
        expect(() => compile({ ...spec, width: 480 })).not.toThrow();
    });
});
