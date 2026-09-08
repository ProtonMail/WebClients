import { findToolResultForCall, setToolCallInBlocks, setToolResultInBlocks } from './messageHelpers';
import type { ContentBlock, ToolCallBlock } from './types';

const toolCallBlock = (id: string | undefined, city: string): ToolCallBlock => {
    const payload = { ...(id ? { id } : {}), name: 'weather', arguments: { location: { city } } };
    return { type: 'tool_call', content: JSON.stringify(payload), toolCall: payload };
};

describe('setToolCallInBlocks', () => {
    it('keeps multiple server tool calls that share the same name when ids differ', () => {
        const londonAnnounce = JSON.stringify({ id: 'call_1', name: 'weather' });
        const parisAnnounce = JSON.stringify({ id: 'call_2', name: 'weather' });
        const londonDispatch = JSON.stringify({
            id: 'call_1',
            name: 'weather',
            arguments: { location: { city: 'London', country_code: 'GB' } },
        });
        const parisDispatch = JSON.stringify({
            id: 'call_2',
            name: 'weather',
            arguments: { location: { city: 'Paris', country_code: 'FR' } },
        });

        let blocks: ContentBlock[] = [];
        blocks = setToolCallInBlocks(blocks, londonAnnounce);
        blocks = setToolCallInBlocks(blocks, parisAnnounce);
        blocks = setToolCallInBlocks(blocks, londonDispatch);
        blocks = setToolCallInBlocks(blocks, parisDispatch);

        expect(blocks.filter((block) => block.type === 'tool_call')).toHaveLength(2);
        expect(blocks[0].content).toBe(londonDispatch);
        expect(blocks[1].content).toBe(parisDispatch);
    });

    it('merges announce and dispatch chunks for the same call id', () => {
        const announce = JSON.stringify({ id: 'call_1', name: 'weather' });
        const dispatch = JSON.stringify({
            id: 'call_1',
            name: 'weather',
            arguments: { location: { city: 'London' } },
        });

        let blocks = setToolCallInBlocks([], announce);
        blocks = setToolCallInBlocks(blocks, dispatch);

        expect(blocks).toHaveLength(1);
        expect(blocks[0].content).toBe(dispatch);
    });

    it('reads ids from serialized content when the cached parsed call has no id', () => {
        const announce = JSON.stringify({ id: 'call_0', name: 'weather' });
        const dispatch = JSON.stringify({
            id: 'call_0',
            name: 'weather',
            arguments: { location: { city: 'London' } },
        });
        const blocks: ContentBlock[] = [{ type: 'tool_call', content: announce, toolCall: { name: 'weather' } }];

        const updated = setToolCallInBlocks(blocks, dispatch);

        expect(updated).toHaveLength(1);
        expect(updated[0].content).toBe(dispatch);
    });

    it('does not merge an id-less call into a trailing call whose id is only serialized', () => {
        const existing = JSON.stringify({ id: 'call_0', name: 'weather' });
        const idLessCall = JSON.stringify({
            name: 'weather',
            arguments: { location: { city: 'London' } },
        });
        const blocks: ContentBlock[] = [{ type: 'tool_call', content: existing, toolCall: { name: 'weather' } }];

        const updated = setToolCallInBlocks(blocks, idLessCall);

        expect(updated).toHaveLength(2);
        expect(updated[1].content).toBe(idLessCall);
    });

    it('supports the legacy call_id field', () => {
        const announce = JSON.stringify({ call_id: 'call_0', name: 'weather' });
        const dispatch = JSON.stringify({
            call_id: 'call_0',
            name: 'weather',
            arguments: { location: { city: 'London' } },
        });

        let blocks = setToolCallInBlocks([], announce);
        blocks = setToolCallInBlocks(blocks, dispatch);

        expect(blocks).toHaveLength(1);
        expect(blocks[0].content).toBe(dispatch);
    });

    it('merges legacy streaming chunks without ids by name on the last block', () => {
        const announce = JSON.stringify({ name: 'weather' });
        const dispatch = JSON.stringify({
            name: 'weather',
            arguments: { location: { city: 'London' } },
        });

        let blocks = setToolCallInBlocks([], announce);
        blocks = setToolCallInBlocks(blocks, dispatch);

        expect(blocks).toHaveLength(1);
        expect(blocks[0].content).toBe(dispatch);
    });
});

describe('setToolResultInBlocks', () => {
    it('keeps multiple tool results when call ids differ', () => {
        const londonResult = JSON.stringify({ type: 'Weather', location_name: 'London' });
        const parisResult = JSON.stringify({ type: 'Weather', location_name: 'Paris' });

        let blocks: ContentBlock[] = [
            { type: 'tool_call', content: '{}' },
            { type: 'tool_result', content: londonResult, tool_call_id: 'call_1' },
            { type: 'tool_call', content: '{}' },
        ];
        blocks = setToolResultInBlocks(blocks, parisResult, undefined, 'call_2');

        const results = blocks.filter((block) => block.type === 'tool_result');
        expect(results).toHaveLength(2);
        expect(results[0].content).toBe(londonResult);
        expect(results[1].content).toBe(parisResult);
        expect(results[0].tool_call_id).toBe('call_1');
        expect(results[1].tool_call_id).toBe('call_2');
    });

    it('appends when there is no matching result', () => {
        const blocks = setToolResultInBlocks([], '{"error":true}', undefined, 'call_1');

        expect(blocks).toHaveLength(1);
        expect(blocks[0].type).toBe('tool_result');
    });

    it('replaces the tool result for the same call id', () => {
        const partial = JSON.stringify({ type: 'Weather', location_name: 'London' });
        const final = JSON.stringify({ type: 'Weather', location_name: 'London', temperature: 12.8 });

        let blocks = setToolResultInBlocks([], partial, undefined, 'call_1');
        blocks = setToolResultInBlocks(blocks, final, undefined, 'call_1');

        expect(blocks).toHaveLength(1);
        expect(blocks[0].content).toBe(final);
    });

    it('pairs sequential id-less tool results with the first unpaired tagged tool calls', () => {
        const googlCall = JSON.stringify({ id: 'call_0', name: 'stock', arguments: { symbol: 'GOOGL' } });
        const aaplCall = JSON.stringify({ id: 'call_1', name: 'stock', arguments: { symbol: 'AAPL' } });
        const metaCall = JSON.stringify({ id: 'call_2', name: 'stock', arguments: { symbol: 'META' } });
        const googlResult = JSON.stringify({
            current_price: 338.46,
            monthly_trend: [{ date: '2026-09-04', price: 338.46, volume: 1 }],
        });
        const aaplResult = JSON.stringify({
            current_price: 319.97,
            monthly_trend: [{ date: '2026-09-04', price: 319.97, volume: 1 }],
        });
        const metaResult = JSON.stringify({
            current_price: 616.77,
            monthly_trend: [{ date: '2026-09-04', price: 616.77, volume: 1 }],
        });

        let blocks: ContentBlock[] = [];
        blocks = setToolCallInBlocks(blocks, googlCall);
        blocks = setToolCallInBlocks(blocks, aaplCall);
        blocks = setToolCallInBlocks(blocks, metaCall);
        blocks = setToolResultInBlocks(blocks, googlResult);
        blocks = setToolResultInBlocks(blocks, aaplResult);
        blocks = setToolResultInBlocks(blocks, metaResult);

        const results = blocks.filter((block) => block.type === 'tool_result');
        expect(results).toHaveLength(3);
        expect(results[0].tool_call_id).toBe('call_0');
        expect(results[1].tool_call_id).toBe('call_1');
        expect(results[2].tool_call_id).toBe('call_2');

        const calls = blocks.filter((block) => block.type === 'tool_call') as ToolCallBlock[];
        expect(findToolResultForCall(blocks, calls[0])?.content).toBe(googlResult);
        expect(findToolResultForCall(blocks, calls[1])?.content).toBe(aaplResult);
        expect(findToolResultForCall(blocks, calls[2])?.content).toBe(metaResult);
    });
});

describe('findToolResultForCall', () => {
    it('pairs parallel calls with results by call id', () => {
        const londonCall = toolCallBlock('call_0', 'London');
        const parisCall = toolCallBlock('call_1', 'Paris');
        const londonResult = JSON.stringify({ type: 'Weather', location_name: 'London', temperature: 14 });
        const parisResult = JSON.stringify({ type: 'Weather', location_name: 'Paris', temperature: 16 });
        const blocks: ContentBlock[] = [
            londonCall,
            parisCall,
            { type: 'tool_result', content: londonResult, tool_call_id: 'call_0' },
            { type: 'tool_result', content: parisResult, tool_call_id: 'call_1' },
        ];

        expect(findToolResultForCall(blocks, londonCall)?.content).toBe(londonResult);
        expect(findToolResultForCall(blocks, parisCall)?.content).toBe(parisResult);
    });

    it('pairs parallel stock calls with finance results using claim-based fallback', () => {
        const googlCall = JSON.stringify({ id: 'call_0', name: 'stock', arguments: { symbol: 'GOOGL' } });
        const aaplCall = JSON.stringify({ id: 'call_1', name: 'stock', arguments: { symbol: 'AAPL' } });
        const googlResult = JSON.stringify({
            current_price: 338.46,
            monthly_trend: [{ date: '2026-09-04', price: 338.46, volume: 1 }],
            company_info: { name: 'Alphabet Inc.' },
        });
        const aaplResult = JSON.stringify({
            current_price: 319.97,
            monthly_trend: [{ date: '2026-09-04', price: 319.97, volume: 1 }],
            company_info: { name: 'Apple Inc.' },
        });

        const blocks: ContentBlock[] = [
            { type: 'tool_call', content: googlCall, toolCall: JSON.parse(googlCall) },
            { type: 'tool_call', content: aaplCall, toolCall: JSON.parse(aaplCall) },
            { type: 'tool_result', content: googlResult },
            { type: 'tool_result', content: aaplResult },
        ];

        const calls = blocks.filter((block) => block.type === 'tool_call') as ToolCallBlock[];
        expect(findToolResultForCall(blocks, calls[0])?.content).toBe(googlResult);
        expect(findToolResultForCall(blocks, calls[1])?.content).toBe(aaplResult);
    });

    it('falls back to the next untagged result for a legacy call', () => {
        const call = toolCallBlock(undefined, 'London');
        const result = JSON.stringify({ type: 'Weather', location_name: 'London', temperature: 14 });
        const blocks: ContentBlock[] = [call, { type: 'tool_result', content: result }];

        expect(findToolResultForCall(blocks, call)?.content).toBe(result);
    });
});
