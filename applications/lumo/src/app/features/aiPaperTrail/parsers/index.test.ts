import JSZip from 'jszip';

import { PaperTrailParseError, formatPaperTrailFileReadError, parseExportFile, parseExportText } from './index';
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

describe('formatPaperTrailFileReadError', () => {
    it('maps NotReadableError to a friendly upload message', () => {
        const error = new DOMException(
            'The requested file could not be read, typically due to permission problems that have occurred after a reference to a file was acquired.',
            'NotReadableError'
        );

        expect(formatPaperTrailFileReadError(error)).toBe(
            'We could not read this file. Select it again, or move it out of cloud storage before uploading.'
        );
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

    it('parses privacy-portal exports with nested Conversations zip files', async () => {
        const conversationsZip = new JSZip();
        conversationsZip.file(
            'conversations-000.json',
            JSON.stringify([
                {
                    title: 'Nested export',
                    mapping: {
                        a: {
                            message: {
                                author: { role: 'user' },
                                content: { parts: ['hello from nested zip'] },
                            },
                        },
                    },
                },
            ])
        );

        const outerZip = new JSZip();
        outerZip.file(
            'Conversations__user-chatgpt-0001.zip',
            await conversationsZip.generateAsync({ type: 'uint8array' })
        );

        const blob = await outerZip.generateAsync({ type: 'blob' });
        const file = new File([blob], 'chatgpt-privacy-export.zip', { type: 'application/zip' });
        const result = await parseExportFile(file);

        expect(result.source).toBe('chatgpt');
        expect(result.conversations).toHaveLength(1);
        expect(result.conversations[0]?.userPrompts[0]?.text).toBe('hello from nested zip');
    });
});
