import { isChatGptExport, parseChatGptExport } from './chatgpt';

const sample = [
    {
        title: 'Budget worries',
        create_time: 1700000000,
        mapping: {
            root: { message: null },
            a: {
                message: {
                    author: { role: 'system' },
                    content: { content_type: 'text', parts: ['you are helpful'] },
                    create_time: 1700000001,
                },
            },
            b: {
                message: {
                    author: { role: 'user' },
                    content: { content_type: 'text', parts: ['How do I pay off my debt?'] },
                    create_time: 1700000003,
                },
            },
            c: {
                message: {
                    author: { role: 'assistant' },
                    content: { content_type: 'text', parts: ['Here is advice'] },
                    create_time: 1700000004,
                },
            },
            d: {
                message: {
                    author: { role: 'user' },
                    content: { content_type: 'text', parts: ['I earn 30k, is that enough?'] },
                    create_time: 1700000002,
                },
            },
        },
    },
];

describe('chatgpt parser', () => {
    it('detects a ChatGPT export', () => {
        expect(isChatGptExport(sample)).toBe(true);
        expect(isChatGptExport([{ chat_messages: [] }])).toBe(false);
    });

    it('keeps only user prompts, ordered by create_time', () => {
        const result = parseChatGptExport(sample);
        expect(result.source).toBe('chatgpt');
        expect(result.conversations).toHaveLength(1);
        expect(result.conversations[0].title).toBe('Budget worries');
        expect(result.conversations[0].userPrompts).toEqual([
            'I earn 30k, is that enough?',
            'How do I pay off my debt?',
        ]);
    });

    it('ignores non-text parts and empty conversations', () => {
        const result = parseChatGptExport([
            {
                title: 'Image chat',
                mapping: {
                    a: {
                        message: {
                            author: { role: 'user' },
                            content: { content_type: 'multimodal_text', parts: [{ asset_pointer: 'x' }, 'caption'] },
                        },
                    },
                },
            },
            { title: 'Empty', mapping: {} },
        ] as any);
        expect(result.conversations).toHaveLength(1);
        expect(result.conversations[0].userPrompts).toEqual(['caption']);
    });
});
