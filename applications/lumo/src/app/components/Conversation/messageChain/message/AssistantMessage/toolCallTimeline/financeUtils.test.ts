import { setToolCallInBlocks, setToolResultInBlocks } from '../../../../../../messageHelpers';
import type { ContentBlock } from '../../../../../../types';
import { collectFinanceComparisonItems } from './financeUtils';

describe('collectFinanceComparisonItems', () => {
    const googlCall = JSON.stringify({ id: 'call_0', name: 'stock', arguments: { symbol: 'GOOGL' } });
    const aaplCall = JSON.stringify({ id: 'call_1', name: 'stock', arguments: { symbol: 'AAPL' } });
    const metaCall = JSON.stringify({ id: 'call_2', name: 'stock', arguments: { symbol: 'META' } });

    const makeFinanceResult = (company: string, price: number) =>
        JSON.stringify({
            current_price: price,
            monthly_trend: [{ date: '2026-09-04', price, volume: 1 }],
            company_info: { name: company },
        });

    it('pairs each requested ticker to the next unclaimed finance result when call ids mismatch', () => {
        const blocks: ContentBlock[] = [
            { type: 'tool_call', content: googlCall, toolCall: JSON.parse(googlCall) },
            { type: 'tool_call', content: aaplCall, toolCall: JSON.parse(aaplCall) },
            { type: 'tool_call', content: metaCall, toolCall: JSON.parse(metaCall) },
            {
                type: 'tool_result',
                content: makeFinanceResult('Alphabet Inc Class A', 338.46),
                tool_call_id: 'call_2',
            },
            {
                type: 'tool_result',
                content: makeFinanceResult('Apple Inc.', 319.97),
                tool_call_id: 'call_1',
            },
        ];

        const items = collectFinanceComparisonItems(blocks);

        expect(items).toHaveLength(2);
        expect(items[0]).toMatchObject({
            symbol: 'GOOGL',
            data: { current_price: 338.46, company_info: { name: 'Alphabet Inc Class A' } },
        });
        expect(items[1]).toMatchObject({
            symbol: 'AAPL',
            data: { current_price: 319.97, company_info: { name: 'Apple Inc.' } },
        });
    });

    it('collects all three tickers when every finance result is present', () => {
        const blocks: ContentBlock[] = [
            { type: 'tool_call', content: googlCall, toolCall: JSON.parse(googlCall) },
            { type: 'tool_call', content: aaplCall, toolCall: JSON.parse(aaplCall) },
            { type: 'tool_call', content: metaCall, toolCall: JSON.parse(metaCall) },
            {
                type: 'tool_result',
                content: makeFinanceResult('Alphabet Inc Class A', 338.46),
                tool_call_id: 'call_2',
            },
            {
                type: 'tool_result',
                content: makeFinanceResult('Apple Inc.', 319.97),
                tool_call_id: 'call_1',
            },
            {
                type: 'tool_result',
                content: makeFinanceResult('Meta Platforms Inc.', 616.77),
                tool_call_id: 'call_2',
            },
        ];

        const items = collectFinanceComparisonItems(blocks);

        expect(items).toHaveLength(3);
        expect(items.map((item) => item.symbol)).toEqual(['GOOGL', 'AAPL', 'META']);
        expect(items[0].data.company_info?.name).toBe('Alphabet Inc Class A');
        expect(items[1].data.company_info?.name).toBe('Apple Inc.');
        expect(items[2].data.company_info?.name).toBe('Meta Platforms Inc.');
    });

    it('collects multiple finance results even when only the last call id matches', () => {
        const blocks: ContentBlock[] = [
            { type: 'tool_call', content: googlCall, toolCall: JSON.parse(googlCall) },
            { type: 'tool_call', content: aaplCall, toolCall: JSON.parse(aaplCall) },
            { type: 'tool_call', content: metaCall, toolCall: JSON.parse(metaCall) },
            {
                type: 'tool_result',
                content: makeFinanceResult('Meta Platforms Inc.', 616.77),
                tool_call_id: 'call_2',
            },
        ];

        expect(collectFinanceComparisonItems(blocks)).toHaveLength(1);

        blocks.splice(3, 0, {
            type: 'tool_result',
            content: makeFinanceResult('Alphabet Inc.', 338.46),
        });
        blocks.splice(3, 0, {
            type: 'tool_result',
            content: makeFinanceResult('Apple Inc.', 319.97),
        });

        const items = collectFinanceComparisonItems(blocks);
        expect(items.map((item) => item.symbol)).toEqual(['GOOGL', 'AAPL', 'META']);
    });

    it('collects items after sequential id-less results are stored for tagged calls', () => {
        let blocks: ContentBlock[] = [];
        blocks = setToolCallInBlocks(blocks, googlCall);
        blocks = setToolCallInBlocks(blocks, aaplCall);
        blocks = setToolCallInBlocks(blocks, metaCall);
        blocks = setToolResultInBlocks(blocks, makeFinanceResult('Alphabet Inc.', 338.46));
        blocks = setToolResultInBlocks(blocks, makeFinanceResult('Apple Inc.', 319.97));
        blocks = setToolResultInBlocks(blocks, makeFinanceResult('Meta Platforms Inc.', 616.77));

        const items = collectFinanceComparisonItems(blocks);
        expect(items).toHaveLength(3);
        expect(items.map((item) => item.symbol)).toEqual(['GOOGL', 'AAPL', 'META']);
        expect(blocks.filter((block) => block.type === 'tool_result')).toHaveLength(3);
    });

    it('collects items when duplicate call ids were appended as separate finance results', () => {
        let blocks: ContentBlock[] = [];
        blocks = setToolCallInBlocks(blocks, googlCall);
        blocks = setToolCallInBlocks(blocks, aaplCall);
        blocks = setToolCallInBlocks(blocks, metaCall);
        blocks = setToolResultInBlocks(blocks, makeFinanceResult('Alphabet Inc.', 338.46), undefined, 'call_shared');
        blocks = setToolResultInBlocks(blocks, makeFinanceResult('Apple Inc.', 319.97), undefined, 'call_shared');
        blocks = setToolResultInBlocks(blocks, makeFinanceResult('Meta Platforms Inc.', 616.77), undefined, 'call_shared');

        expect(blocks.filter((block) => block.type === 'tool_result')).toHaveLength(3);

        const items = collectFinanceComparisonItems(blocks);
        expect(items).toHaveLength(3);
        expect(items.map((item) => item.symbol)).toEqual(['GOOGL', 'AAPL', 'META']);
    });
});
