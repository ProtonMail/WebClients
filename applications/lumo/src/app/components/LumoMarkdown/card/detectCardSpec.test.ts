import { looksLikeCardSpec, looksLikeCardSpecPartial, looksLikeMetricCardPartial, shouldRenderAsCard, splitAroundOpenCardCodeFence } from './detectCardSpec';
import { parseCardSpec } from './parseCardSpec';

describe('detectCardSpec', () => {
    it('detects explicit card fences', () => {
        expect(shouldRenderAsCard('card', '{"type":"metric","title":"DAU","value":"1"}')).toBe(true);
    });

    it('detects card JSON in json fences as a fallback', () => {
        const code = JSON.stringify({
            type: 'metric',
            title: 'Daily Active Users',
            value: '48.2k',
            delta: '+22% MoM',
            direction: 'up',
        });

        expect(shouldRenderAsCard('json', code)).toBe(true);
        expect(looksLikeCardSpec(code)).toBe(true);
    });

    it('does not treat Vega specs as cards', () => {
        const code = JSON.stringify({
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            mark: 'bar',
            encoding: { x: { field: 'a', type: 'nominal' }, y: { field: 'b', type: 'quantitative' } },
        });

        expect(shouldRenderAsCard('json', code)).toBe(false);
    });

    it('detects streaming metric card fences', () => {
        const content = '```card\n{"type":"metric","title":"Latency","value":"';

        expect(looksLikeMetricCardPartial('{"type":"metric","title":"Latency","value":"')).toBe(true);
        expect(splitAroundOpenCardCodeFence(content)).toMatchObject({
            language: 'card',
            body: '{"type":"metric","title":"Latency","value":"',
        });
    });

    it('does not treat Vega specs with axis titles as cards', () => {
        const code = JSON.stringify({
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            title: {
                text: 'Geneva Monthly Climate Overview',
                subtitle: 'Temperatures peak at 24 °C in Jul',
            },
            data: {
                values: [{ month: 'Jan', temp: -1, rainfall: 42 }],
            },
            vconcat: [
                {
                    mark: 'line',
                    encoding: {
                        x: { field: 'month', type: 'ordinal', title: 'Month' },
                        y: { field: 'temp', type: 'quantitative', title: 'Temperature (°C)' },
                    },
                },
            ],
        });

        expect(shouldRenderAsCard('json', code)).toBe(false);
        expect(looksLikeCardSpecPartial(code)).toBe(false);
    });
});

describe('parseCardSpec', () => {
    it('parses metric cards', () => {
        expect(
            parseCardSpec(
                JSON.stringify({
                    type: 'metric',
                    title: 'p99 Latency',
                    value: '212ms',
                    delta: '-8ms',
                    direction: 'up',
                })
            )
        ).toMatchObject({
            type: 'metric',
            title: 'p99 Latency',
            value: '212ms',
        });
    });

    it('parses summary cards', () => {
        expect(
            parseCardSpec(
                JSON.stringify({
                    type: 'summary',
                    title: 'Lumo Metrics Summary',
                    body: 'DAU grew strongly this month.',
                    tags: ['DAU'],
                })
            )
        ).toMatchObject({
            type: 'summary',
            tags: ['DAU'],
        });
    });

    it('parses summary cards without a title', () => {
        const code = JSON.stringify({
            type: 'summary',
            body: 'Lumo gained 22% DAU month-over-month while simultaneously improving p99 latency by 8 ms.',
        });

        expect(parseCardSpec(code)).toMatchObject({
            type: 'summary',
            title: '',
            body: 'Lumo gained 22% DAU month-over-month while simultaneously improving p99 latency by 8 ms.',
        });
        expect(shouldRenderAsCard('json', code)).toBe(true);
        expect(looksLikeCardSpec(code)).toBe(true);
    });
});
