import { StreamProcessor } from './streaming';

describe('StreamProcessor', () => {
    const formatOpenAiChunk = (delta: Record<string, unknown>) =>
        `data: ${JSON.stringify({ choices: [{ index: 0, delta }] })}\n\n`;

    it('maps comment lines to legacy status events', () => {
        const processor = new StreamProcessor();

        expect(processor.processChunk(':queued\n\n')).toEqual([{ type: 'queued' }]);
        expect(processor.processChunk(':ingesting\n\n')).toEqual([{ type: 'ingesting', target: 'message' }]);
    });

    it('maps content deltas to token_data message chunks', () => {
        const processor = new StreamProcessor();

        const messages = processor.processChunk(formatOpenAiChunk({ content: 'Hello' }));
        expect(messages).toEqual([
            {
                type: 'token_data',
                target: 'message',
                count: 0,
                content: 'Hello',
            },
        ]);
    });

    it('defaults untagged content deltas to the outgoing lumo target', () => {
        const processor = new StreamProcessor('title');

        const messages = processor.processChunk(formatOpenAiChunk({ content: 'Trip to Kyoto' }));
        expect(messages).toEqual([
            {
                type: 'token_data',
                target: 'title',
                count: 0,
                content: 'Trip to Kyoto',
            },
        ]);
        expect(processor.processChunk(':ingesting\n\n')).toEqual([{ type: 'ingesting', target: 'title' }]);
    });

    it('maps reasoning deltas to token_data reasoning chunks', () => {
        const processor = new StreamProcessor();

        const messages = processor.processChunk(formatOpenAiChunk({ reasoning_content: 'thinking' }));
        expect(messages).toEqual([
            {
                type: 'token_data',
                target: 'reasoning',
                count: 0,
                content: 'thinking',
            },
        ]);
    });

    it('accumulates tool call fragments into legacy tool_call JSON', () => {
        const processor = new StreamProcessor();

        processor.processChunk(
            formatOpenAiChunk({
                tool_calls: [{ index: 0, function: { name: 'web_search', arguments: '{"search_term":' } }],
            })
        );

        const messages = processor.processChunk(
            formatOpenAiChunk({
                tool_calls: [{ index: 0, function: { arguments: '"weather"}' } }],
            })
        );

        expect(messages).toEqual([
            {
                type: 'token_data',
                target: 'tool_call',
                count: 1,
                content: JSON.stringify({
                    name: 'web_search',
                    parameters: { search_term: 'weather' },
                }),
            },
        ]);
    });

    it('emits done on [DONE] and stream errors on error chunks', () => {
        const processor = new StreamProcessor();

        expect(processor.processChunk('data: [DONE]\n\n')).toEqual([{ type: 'done' }]);
        expect(processor.processChunk('data: {"error":{"message":"boom"}}\n\n')).toEqual([{ type: 'error' }]);
    });

    it('maps content_filter finish_reason to harmful', () => {
        const processor = new StreamProcessor();

        const messages = processor.processChunk(
            `data: ${JSON.stringify({ choices: [{ index: 0, finish_reason: 'content_filter' }] })}\n\n`
        );

        expect(messages).toEqual([{ type: 'harmful' }]);
    });
});
