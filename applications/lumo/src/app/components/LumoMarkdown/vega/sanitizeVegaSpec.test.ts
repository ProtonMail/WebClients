import { sanitizeVegaSpec, VegaSpecParseError, VegaSpecSecurityError } from './sanitizeVegaSpec';
import { PROTON_BAR_COLOR } from './protonVegaTheme';

describe('sanitizeVegaSpec', () => {
    const validSpec = JSON.stringify({
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        description: 'Sample chart',
        data: {
            values: [
                { category: 'A', amount: 28 },
                { category: 'B', amount: 55 },
            ],
        },
        mark: 'bar',
        encoding: {
            x: { field: 'category', type: 'nominal' },
            y: { field: 'amount', type: 'quantitative' },
        },
    });

    it('accepts inline Vega-Lite specs', () => {
        const spec = sanitizeVegaSpec(validSpec);
        expect(spec).toMatchObject({
            mark: { type: 'bar', color: PROTON_BAR_COLOR },
        });
    });

    it('rejects external data URLs', () => {
        const spec = JSON.stringify({
            data: { url: 'https://example.com/data.json' },
            mark: 'bar',
            encoding: {
                x: { field: 'category', type: 'nominal' },
                y: { field: 'amount', type: 'quantitative' },
            },
        });

        expect(() => sanitizeVegaSpec(spec)).toThrow(VegaSpecSecurityError);
    });

    it('rejects nested lookup data URLs', () => {
        const spec = JSON.stringify({
            transform: [
                {
                    lookup: 'id',
                    from: {
                        data: {
                            url: 'https://example.com/lookup.json',
                        },
                        key: 'id',
                        fields: ['value'],
                    },
                },
            ],
            mark: 'bar',
            encoding: {
                x: { field: 'category', type: 'nominal' },
                y: { field: 'amount', type: 'quantitative' },
            },
        });

        expect(() => sanitizeVegaSpec(spec)).toThrow(VegaSpecSecurityError);
    });

    it('strips dangerous usermeta embed overrides', () => {
        const spec = JSON.stringify({
            usermeta: {
                embedOptions: {
                    loader: { http: true },
                    actions: true,
                },
            },
            data: { values: [{ x: 1 }] },
            mark: 'point',
            encoding: {
                x: { field: 'x', type: 'quantitative' },
            },
        });

        const sanitized = sanitizeVegaSpec(spec) as { usermeta?: Record<string, unknown> };
        expect(sanitized.usermeta?.embedOptions).toBeUndefined();
    });

    it('rejects invalid JSON', () => {
        expect(() => sanitizeVegaSpec('{ not json')).toThrow(VegaSpecParseError);
        expect(() => sanitizeVegaSpec('{ not json')).toThrow(/not valid JSON/);
    });

    it('accepts trailing commas from LLM output', () => {
        const spec = `{
            "mark": "bar",
            "encoding": {
                "x": { "field": "category", "type": "nominal" },
                "y": { "field": "amount", "type": "quantitative" },
            },
            "data": { "values": [{ "category": "A", "amount": 1 },] },
        }`;

        expect(sanitizeVegaSpec(spec)).toMatchObject({ mark: { type: 'bar', color: PROTON_BAR_COLOR } });
    });

    it('accepts unquoted object keys from LLM output', () => {
        const spec = `{
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "width": "container",
            "data": {
                "values": [
                    {"week": 1, "DAU": 31.2},
                    {"week": 2, "DAU": 33.4}
                ]
            },
            "mark": {"type": "line", "point": true},
            "encoding": {
                "x": {"field": "week", "type": "ordinal", "axis": {"title": "Week"}},
                "y": {"field": "DAU", "type": "quantitative", "axis": {"title": "DAU (k)", format: ".1f"}}
            }
        }`;

        const sanitized = sanitizeVegaSpec(spec) as {
            encoding?: { y?: { axis?: { format?: string } } };
        };

        expect(sanitized.encoding?.y?.axis).toMatchObject({ format: '.1f' });
    });

    it('allows url as a data field name inside inline values', () => {
        const spec = JSON.stringify({
            mark: 'bar',
            encoding: {
                x: { field: 'url', type: 'nominal' },
                y: { field: 'amount', type: 'quantitative' },
            },
            data: {
                values: [{ url: 'https://example.com/page', amount: 3 }],
            },
        });

        expect(sanitizeVegaSpec(spec)).toMatchObject({ mark: { type: 'bar', color: PROTON_BAR_COLOR } });
    });

    it('forces responsive width so charts fill the card', () => {
        const spec = JSON.stringify({
            width: 480,
            height: 260,
            mark: 'line',
            encoding: {
                x: { field: 'year', type: 'ordinal' },
                y: { field: 'price', type: 'quantitative' },
            },
            data: {
                values: [{ year: 2020, price: 40 }],
            },
        });

        const sanitized = sanitizeVegaSpec(spec);
        expect(sanitized).toMatchObject({
            width: 'container',
            height: 260,
        });
        expect((sanitized as Record<string, unknown>).autosize).toEqual({ type: 'fit-x', contains: 'padding' });
    });
});
