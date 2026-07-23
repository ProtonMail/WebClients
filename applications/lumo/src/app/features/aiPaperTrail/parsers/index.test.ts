import JSZip from 'jszip';

import { PaperTrailParseError, parseExportFile, parseExportText } from './index';
import { mergeConversationJsonTexts } from './zipConversations';

describe('parseExportText', () => {
    it('routes ChatGPT exports', () => {
        const result = parseExportText(
            JSON.stringify([
                {
                    title: 'T',
                    mapping: { a: { message: { author: { role: 'user' }, content: { parts: ['hi'] } } } },
                },
            ])
        );
        expect(result.source).toBe('chatgpt');
    });

    it('routes Claude exports', () => {
        const result = parseExportText(
            JSON.stringify([{ name: 'T', chat_messages: [{ sender: 'human', text: 'hi' }] }])
        );
        expect(result.source).toBe('claude');
    });

    it('throws on invalid JSON', () => {
        expect(() => parseExportText('not json')).toThrow(PaperTrailParseError);
    });

    it('throws on unrecognised shapes', () => {
        expect(() => parseExportText(JSON.stringify([{ foo: 'bar' }]))).toThrow(PaperTrailParseError);
    });
});

describe('mergeConversationJsonTexts', () => {
    it('merges chunked conversation files into one export', () => {
        const merged = mergeConversationJsonTexts([
            JSON.stringify([
                {
                    title: 'First chunk',
                    mapping: {
                        a: {
                            message: {
                                author: { role: 'user' },
                                content: { parts: ['from chunk 0'] },
                            },
                        },
                    },
                },
            ]),
            JSON.stringify([
                {
                    title: 'Second chunk',
                    mapping: {
                        b: {
                            message: {
                                author: { role: 'user' },
                                content: { parts: ['from chunk 1'] },
                            },
                        },
                    },
                },
            ]),
        ]);

        const result = parseExportText(merged);
        expect(result.conversations.map((conversation) => conversation.title)).toEqual([
            'First chunk',
            'Second chunk',
        ]);
    });
});

describe('parseExportFile', () => {
    it('parses ChatGPT zip exports with conversations-NNN.json files', async () => {
        const zip = new JSZip();
        zip.file(
            'conversations-000.json',
            JSON.stringify([
                {
                    title: 'Chunk 0',
                    mapping: {
                        a: {
                            message: {
                                author: { role: 'user' },
                                content: { parts: ['hello from 000'] },
                            },
                        },
                    },
                },
            ])
        );
        zip.file(
            'conversations-001.json',
            JSON.stringify([
                {
                    title: 'Chunk 1',
                    mapping: {
                        b: {
                            message: {
                                author: { role: 'user' },
                                content: { parts: ['hello from 001'] },
                            },
                        },
                    },
                },
            ])
        );

        const blob = await zip.generateAsync({ type: 'blob' });
        const file = new File([blob], 'chatgpt-export.zip', { type: 'application/zip' });
        const result = await parseExportFile(file);

        expect(result.source).toBe('chatgpt');
        expect(result.conversations).toHaveLength(2);
        expect(result.conversations.flatMap((conversation) => conversation.userPrompts.map((prompt) => prompt.text))).toEqual(
            ['hello from 000', 'hello from 001']
        );
    });
});
