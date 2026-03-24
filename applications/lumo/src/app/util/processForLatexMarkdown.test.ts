import { processForLatexMarkdown } from './tokens';

describe('processForLatexMarkdown', () => {
    it('should convert $...$ inline math to $$...$$', () => {
        expect(processForLatexMarkdown("Here's an inline equation: $E = mc^2$ and $\\frac{-b}{2a}$")).toBe(
            "Here's an inline equation: $$E = mc^2$$ and $$\\frac{-b}{2a}$$"
        );
    });

    it('should not convert currency-like patterns ($5 and $10)', () => {
        expect(processForLatexMarkdown('costs $5 and $10 per month')).toBe('costs $5 and $10 per month');
    });

    it('should not double-convert already-normalised $$...$$', () => {
        const input = '$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$';
        expect(processForLatexMarkdown(input)).toBe(input);
    });

    it('should convert \\(...\\) and \\[...\\] delimiters to $$...$$', () => {
        expect(processForLatexMarkdown('Inline \\(F = ma\\) and block \\[z^2\\]')).toBe(
            'Inline $$F = ma$$ and block $$z^2$$'
        );
    });

    it('should handle all delimiter styles together and leave currency untouched', () => {
        expect(processForLatexMarkdown('It costs $5 but energy is $E = mc^2$ and \\(F = ma\\)')).toBe(
            'It costs $5 but energy is $$E = mc^2$$ and $$F = ma$$'
        );
    });
});
