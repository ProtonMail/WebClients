import { PaperTrailParseError, parseExportText } from './index';

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
