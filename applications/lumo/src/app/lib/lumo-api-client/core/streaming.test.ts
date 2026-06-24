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
                tool_calls: [{ index: 0, function: { name: 'web_search', arguments: '{"query":' } }],
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
                    parameters: { query: 'weather' },
                }),
            },
        ]);
    });

    it('maps usage-only chunks to usage messages', () => {
        const processor = new StreamProcessor();

        const messages = processor.processChunk(
            `data: ${JSON.stringify({
                usage: {
                    completion_tokens: 42,
                    remaining_limits: {
                        lite: 98,
                        max: 20,
                        images: 19,
                    },
                    applied_limit_category: 'lite',
                    image_limit_applied: false,
                },
            })}\n\n`
        );

        expect(messages).toEqual([
            {
                type: 'usage',
                usage: {
                    completion_tokens: 42,
                    remaining_limits: {
                        lite: 98,
                        max: 20,
                        images: 19,
                    },
                    applied_limit_category: 'lite',
                    image_limit_applied: false,
                },
            },
        ]);
    });

    it('emits done on [DONE] and stream errors on error chunks', () => {
        const processor = new StreamProcessor();

        expect(processor.processChunk('data: [DONE]\n\n')).toEqual([{ type: 'done' }]);
        expect(processor.processChunk('data: {"error":{"message":"boom"}}\n\n')).toEqual([{ type: 'error' }]);
    });

    it('maps stream error codes to legacy terminal types', () => {
        const processor = new StreamProcessor();
        const rejectedEvent =
            '{"error":{"message":"Request was rejected due to high demand. Please try again later.","type":"server_error","code":"rejected"}}';

        expect(processor.processChunk('data: {"error":{"code":"timeout","type":"server_error"}}\n\n')).toEqual([
            { type: 'timeout' },
        ]);
        expect(processor.processChunk(`data: ${rejectedEvent}\n\n`)).toEqual([{ type: 'rejected' }]);
        expect(processor.processChunk('data: {"error":{"code":"error","type":"server_error"}}\n\n')).toEqual([
            { type: 'error' },
        ]);
        expect(processor.processChunk('data: {"error":{"code":"upstream_failure"}}\n\n')).toEqual([{ type: 'error' }]);
    });

    it('maps normalised context_length_exceeded stream errors to tool-error', () => {
        const processor = new StreamProcessor();
        const event =
            '{"error":{"message":"This model\'s maximum context length is 8192 tokens. However, you requested 99999 tokens. Please reduce the length of the messages.","type":"invalid_request_error","code":"context_length_exceeded"}}';

        expect(processor.processChunk(`data: ${event}\n\n`)).toEqual([
            {
                type: 'tool-error',
                error: {
                    code: 'context_length_exceeded',
                    message:
                        "This model's maximum context length is 8192 tokens. However, you requested 99999 tokens. Please reduce the length of the messages.",
                },
            },
        ]);
    });

    it('passes through legacy tool-error events for context_length_exceeded', () => {
        const processor = new StreamProcessor();
        const event =
            '{"type":"tool-error","error":{"code":"context_length_exceeded","message":"This model\'s maximum context length is 8192 tokens"}}';

        expect(processor.processChunk(`data: ${event}\n\n`)).toEqual([
            {
                type: 'tool-error',
                error: {
                    code: 'context_length_exceeded',
                    message: "This model's maximum context length is 8192 tokens",
                },
            },
        ]);
    });

    it('maps content_filter finish_reason to harmful', () => {
        const processor = new StreamProcessor();

        const messages = processor.processChunk(
            `data: ${JSON.stringify({ choices: [{ index: 0, finish_reason: 'content_filter' }] })}\n\n`
        );

        expect(messages).toEqual([{ type: 'harmful' }]);
    });

    it('maps chat.tool_call chunks to legacy tool_call token_data', () => {
        const processor = new StreamProcessor();

        const nameOnly = processor.processChunk(
            `data: ${JSON.stringify({
                object: 'chat.tool_call',
                tool_call: { id: 'call_0', name: 'web_search' },
            })}\n\n`
        );

        expect(nameOnly).toEqual([
            {
                type: 'token_data',
                target: 'tool_call',
                count: 0,
                content: JSON.stringify({ name: 'web_search' }),
            },
        ]);

        const withArgs = processor.processChunk(
            `data: ${JSON.stringify({
                object: 'chat.tool_call',
                tool_call: {
                    id: 'call_0',
                    name: 'web_search',
                    arguments: { query: 'Newcastle United today news latest', topic: 'news' },
                },
            })}\n\n`
        );

        expect(withArgs).toEqual([
            {
                type: 'token_data',
                target: 'tool_call',
                count: 1,
                content: JSON.stringify({
                    name: 'web_search',
                    arguments: { query: 'Newcastle United today news latest', topic: 'news' },
                }),
            },
        ]);
    });

    it('maps chat.tool_result chunks to legacy tool_result token_data', () => {
        const processor = new StreamProcessor();

        const messages = processor.processChunk(
            `data: ${JSON.stringify({
                object: 'chat.tool_result',
                tool_result: {
                    call_id: 'call_0',
                    content: {
                        answer: 'Summary',
                        results: [{ title: 'Example', url: 'https://example.com' }],
                        type: 'WebSearch',
                    },
                },
            })}\n\n`
        );

        expect(messages).toEqual([
            {
                type: 'token_data',
                target: 'tool_result',
                count: 0,
                content: JSON.stringify({
                    results: [{ title: 'Example', url: 'https://example.com' }],
                }),
            },
        ]);
    });

    it('accepts bare JSON lines without an SSE data prefix', () => {
        const processor = new StreamProcessor();

        const messages = processor.processChunk(
            `${JSON.stringify({
                object: 'chat.tool_call',
                tool_call: { id: 'call_0', name: 'stock', arguments: { symbol: 'AAPL' } },
            })}\n\n`
        );

        expect(messages).toEqual([
            {
                type: 'token_data',
                target: 'tool_call',
                count: 0,
                content: JSON.stringify({ name: 'stock', arguments: { symbol: 'AAPL' } }),
            },
        ]);
    });
});
