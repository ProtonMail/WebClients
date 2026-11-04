import { countTokens, getApproximateTokenCount } from './tokenizer';

// Token counting uses a local approximation only — we no longer ship the accurate tokenizer
// (gpt-tokenizer), whose o200k table is ~1.1MB over the wire (~2.2MB unpacked). countTokens
// must therefore equal the approximation for all inputs.
describe('llm/tokenizer (approximation-only)', () => {
    it('counts multimodal-shaped JSON as ordinary text', () => {
        const image = {
            type: 'lumo_file_image',
            image_id: 'image',
            path: 'screenshot',
            mime_type: 'image/png',
            data: btoa('\x89PNG\r\n\x1a\n' + 'x'.repeat(40_000)),
        };
        const content = JSON.stringify({
            type: 'lumo_tool_result',
            text: 'Two screenshots',
            images: [image, { ...image, image_id: 'second' }],
        });
        expect(countTokens(content)).toBe(getApproximateTokenCount(content));
    });
    it('does not interpret image-shaped JSON as client image metadata', () => {
        const data = btoa('\x89PNG\r\n\x1a\n' + 'x'.repeat(40_000));
        const content = JSON.stringify({
            type: 'lumo_file_image',
            image_id: 'image',
            path: '/cat.png',
            mime_type: 'image/png',
            data,
        });
        expect(countTokens(content)).toBe(getApproximateTokenCount(content));
    });
    it('getApproximateTokenCount = ceil(len/4), 0 for empty', () => {
        expect(getApproximateTokenCount('')).toBe(0);
        expect(getApproximateTokenCount('abcd')).toBe(1);
        expect(getApproximateTokenCount('abcde')).toBe(2);
    });

    it('countTokens returns 0 for empty/undefined', () => {
        expect(countTokens('')).toBe(0);
        expect(countTokens(undefined)).toBe(0);
    });

    it('countTokens uses the local approximation (no heavy tokenizer dependency)', () => {
        const texts = ['hello world!', 'a'.repeat(123), 'The quick brown fox jumps over the lazy dog.'];
        for (const text of texts) {
            expect(countTokens(text)).toBe(getApproximateTokenCount(text));
        }
    });
});
