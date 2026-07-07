import { getRenderedSpecJson, prettyJson } from './chartSpecDisplay';

describe('chartSpecDisplay', () => {
    it('pretty-prints valid JSON specs', () => {
        expect(prettyJson('{"mark":"bar"}')).toBe('{\n  "mark": "bar"\n}');
    });

    it('returns the original string when JSON is invalid', () => {
        expect(prettyJson('{ not json')).toBe('{ not json');
    });

    it('returns sanitized spec JSON for valid inline specs', () => {
        const { json, error } = getRenderedSpecJson(
            JSON.stringify({
                mark: 'bar',
                encoding: {
                    x: { field: 'category', type: 'nominal' },
                    y: { field: 'amount', type: 'quantitative' },
                },
                data: { values: [{ category: 'A', amount: 1 }] },
            })
        );

        expect(error).toBeNull();
        expect(json).toContain('"width": "container"');
    });

    it('surfaces sanitize errors for invalid specs', () => {
        const { json, error } = getRenderedSpecJson('{ not json');

        expect(json).toBeNull();
        expect(error).toBeTruthy();
    });
});
