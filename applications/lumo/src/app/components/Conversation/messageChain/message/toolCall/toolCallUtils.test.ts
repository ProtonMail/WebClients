import type { ContentBlock } from '../../../../../types';
import { extractSearchResults } from './toolCallUtils';

describe('extractSearchResults', () => {
    const searchResult = (url: string, title: string) =>
        JSON.stringify({
            results: [{ url, title }],
        });

    const webSearchCall = (query: string, id?: string) =>
        JSON.stringify({
            ...(id ? { id } : {}),
            name: 'web_search',
            arguments: { query },
        });

    it('returns null when there are no web source tool calls', () => {
        const blocks: ContentBlock[] = [{ type: 'text', content: 'Hello' }];
        expect(extractSearchResults(blocks)).toBeNull();
    });

    it('collects results from multiple web searches in one turn', () => {
        const blocks: ContentBlock[] = [
            { type: 'tool_call', content: webSearchCall('first query') },
            { type: 'tool_result', content: searchResult('https://first.example', 'First') },
            { type: 'tool_call', content: webSearchCall('second query') },
            { type: 'tool_result', content: searchResult('https://second.example', 'Second') },
        ];

        expect(extractSearchResults(blocks)).toEqual([
            { url: 'https://first.example', title: 'First' },
            { url: 'https://second.example', title: 'Second' },
        ]);
    });

    it('pairs parallel web searches with their results by call id', () => {
        const blocks: ContentBlock[] = [
            { type: 'tool_call', content: webSearchCall('first query', 'call_0') },
            { type: 'tool_call', content: webSearchCall('second query', 'call_1') },
            {
                type: 'tool_result',
                content: searchResult('https://first.example', 'First'),
                tool_call_id: 'call_0',
            },
            {
                type: 'tool_result',
                content: searchResult('https://second.example', 'Second'),
                tool_call_id: 'call_1',
            },
        ];

        expect(extractSearchResults(blocks)).toEqual([
            { url: 'https://first.example', title: 'First' },
            { url: 'https://second.example', title: 'Second' },
        ]);
    });

    it('deduplicates sources by URL across searches', () => {
        const blocks: ContentBlock[] = [
            { type: 'tool_call', content: webSearchCall('first query') },
            { type: 'tool_result', content: searchResult('https://shared.example', 'Shared') },
            { type: 'tool_call', content: webSearchCall('second query') },
            {
                type: 'tool_result',
                content: searchResult('https://shared.example', 'Shared again'),
            },
        ];

        expect(extractSearchResults(blocks)).toEqual([{ url: 'https://shared.example', title: 'Shared' }]);
    });

    it('includes web_extract results via the default path', () => {
        const blocks: ContentBlock[] = [
            {
                type: 'tool_call',
                content: JSON.stringify({ name: 'web_extract', arguments: { query: 'extract page' } }),
            },
            {
                type: 'tool_result',
                content: JSON.stringify({
                    results: [{ title: 'Extracted', url: 'https://extract.example' }],
                }),
            },
        ];

        expect(extractSearchResults(blocks)).toEqual([{ title: 'Extracted', url: 'https://extract.example' }]);
    });
});
