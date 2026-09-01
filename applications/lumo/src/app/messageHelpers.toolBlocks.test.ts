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

    it('falls back to the next untagged result for a legacy call', () => {
        const call = toolCallBlock(undefined, 'London');
        const result = JSON.stringify({ type: 'Weather', location_name: 'London', temperature: 14 });
        const blocks: ContentBlock[] = [call, { type: 'tool_result', content: result }];

        expect(findToolResultForCall(blocks, call)?.content).toBe(result);
    });
});
