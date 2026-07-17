import {
    hasOpenVegaCodeFence,
    looksLikeVegaSpec,
    looksLikeVegaSpecPartial,
    shouldHoldVegaChartLoading,
    shouldRenderAsVegaChart,
    splitAroundOpenVegaCodeFence,
} from './detectVegaSpec';

describe('looksLikeVegaSpec', () => {
    it('detects specs via $schema', () => {
        const code = JSON.stringify({
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            mark: 'bar',
        });

        expect(looksLikeVegaSpec(code)).toBe(true);
    });

    it('detects malformed model schema URLs that mention vega', () => {
        const code = JSON.stringify({
            $schema: 'https://vega-lang.org/schema/v5',
            title: 'Geneva weather',
            width: 600,
            height: 300,
            data: {
                values: [{ month: 'Jan', temp: 2 }],
            },
        });

        expect(looksLikeVegaSpec(code)).toBe(true);
    });

    it('detects Vega-Lite mark + encoding without schema', () => {
        const code = JSON.stringify({
            mark: 'line',
            encoding: {
                x: { field: 'x', type: 'quantitative' },
            },
        });

        expect(looksLikeVegaSpec(code)).toBe(true);
    });

    it('ignores unrelated JSON', () => {
        expect(looksLikeVegaSpec(JSON.stringify({ name: 'mark', encoding: 'utf-8' }))).toBe(false);
    });
});

describe('shouldRenderAsVegaChart', () => {
    it('accepts explicit vega-lite fences', () => {
        expect(shouldRenderAsVegaChart('vega-lite', '{"mark":"bar"}')).toBe(true);
    });

    it('accepts json fences that contain Vega-Lite', () => {
        const code = JSON.stringify({
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            mark: 'bar',
            encoding: {
                x: { field: 'month', type: 'ordinal' },
            },
        });

        expect(shouldRenderAsVegaChart('json', code)).toBe(true);
    });

    it('accepts partial json while streaming', () => {
        const partial = '{\n  "$schema": "https://vega-lang.org/schema/v5",\n  "data": { "values": [';

        expect(shouldRenderAsVegaChart('json', partial)).toBe(true);
    });
});

describe('splitAroundOpenVegaCodeFence', () => {
    it('detects an open json fence at the end of streaming content', () => {
        const content = 'Here is the chart:\n\n```json\n{\n  "$schema": "https://vega-lang.org/schema/v5",\n';

        expect(splitAroundOpenVegaCodeFence(content)).toEqual({
            prefix: 'Here is the chart:\n\n',
            language: 'json',
            body: '{\n  "$schema": "https://vega-lang.org/schema/v5",\n',
        });
    });

    it('returns null when the fence is already closed', () => {
        const content = '```json\n{"mark":"bar"}\n```';

        expect(splitAroundOpenVegaCodeFence(content)).toBeNull();
        expect(hasOpenVegaCodeFence(content)).toBe(false);
    });
});

describe('looksLikeVegaSpecPartial', () => {
    it('detects partial chart JSON while streaming', () => {
        expect(looksLikeVegaSpecPartial('{\n  "width": 600,\n  "data": { "values": [')).toBe(true);
    });
});

describe('shouldHoldVegaChartLoading', () => {
    it('holds loading for empty or deferred chart code', () => {
        expect(shouldHoldVegaChartLoading('')).toBe(true);
        expect(shouldHoldVegaChartLoading('   ')).toBe(true);
        expect(shouldHoldVegaChartLoading('{"mark":"bar"}', true)).toBe(true);
    });

    it('holds loading for partial specs that are not yet complete', () => {
        const partial = '{\n  "$schema": "https://vega-lang.org/schema/v5",\n  "data": { "values": [';

        expect(shouldHoldVegaChartLoading(partial)).toBe(true);
    });

    it('allows rendering once a spec looks complete', () => {
        const code = JSON.stringify({
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            mark: 'line',
            encoding: {
                x: { field: 'week', type: 'ordinal' },
                y: { field: 'dau', type: 'quantitative' },
            },
        });

        expect(shouldHoldVegaChartLoading(code)).toBe(false);
    });
});
