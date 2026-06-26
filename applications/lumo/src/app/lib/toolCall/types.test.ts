import { tryParseToolCall } from './types';

describe('tryParseToolCall', () => {
    it('accepts legacy parameters payloads and maps search_term to query', () => {
        const parsed = tryParseToolCall(
            JSON.stringify({ name: 'web_search', parameters: { search_term: 'weather in Paris' } })
        );

        expect(parsed).toEqual({
            name: 'web_search',
            arguments: { search_term: 'weather in Paris', query: 'weather in Paris' },
        });
    });

    it('accepts OpenAI-adapted arguments payloads', () => {
        const parsed = tryParseToolCall(
            JSON.stringify({ name: 'stock', arguments: { symbol: 'AAPL' } })
        );

        expect(parsed).toEqual({
            name: 'stock',
            arguments: { symbol: 'AAPL' },
        });
    });

    it('accepts generate_image tool calls', () => {
        const parsed = tryParseToolCall(
            JSON.stringify({
                name: 'generate_image',
                parameters: { prompt: 'A sunset over the ocean' },
            })
        );

        expect(parsed).toEqual({
            name: 'generate_image',
            arguments: { prompt: 'A sunset over the ocean' },
        });
    });

    it('accepts name-only web_search tool calls while arguments are still streaming', () => {
        const parsed = tryParseToolCall(JSON.stringify({ name: 'web_search' }));

        expect(parsed).toEqual({
            name: 'web_search',
            arguments: { query: '' },
        });
    });
});
