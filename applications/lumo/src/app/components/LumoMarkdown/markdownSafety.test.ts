import { findSingleLineParagraphEnd, isPathologicalMarkdown } from './markdownSafety';

describe('findSingleLineParagraphEnd', () => {
    const legacy = (text: string) => text.match(/^((?:(?!\n\n|```|\|[^\n]+\|).)+)(\n\n)/)?.[0].length ?? null;

    it.each([
        'Hello\n\nrest',
        'Hello\nworld\n\nrest',
        '\n\nfoo',
        'no break',
        'a | b | c\n\nx',
        'a | b\n\nx',
        'a ``` b\n\nx',
        '||\n\nx',
        '| |\n\nx',
        'text\n\n',
        'a\rb\n\nx',
        'a\u2028b\n\nx',
        'a\u2029b\n\nx',
    ])('matches the previous regex for %j', (text) => {
        expect(findSingleLineParagraphEnd(text)).toBe(legacy(text));
    });

    it('handles very long lines without throwing', () => {
        const text = `${'a'.repeat(2_000_000)}\n\nrest`;
        expect(findSingleLineParagraphEnd(text)).toBe(2_000_002);
    });
});

describe('isPathologicalMarkdown', () => {
    it('accepts normal markdown', () => {
        expect(isPathologicalMarkdown('# Title\n\n> quote\n\n- [link](http://x.y) and (parens)\n\n---------')).toBe(
            false
        );
    });

    it('flags deeply nested block quotes', () => {
        expect(isPathologicalMarkdown(`${'> '.repeat(500)}text`)).toBe(true);
    });

    it('flags long runs of nesting characters', () => {
        expect(isPathologicalMarkdown(`${'['.repeat(1000)}x`)).toBe(true);
        expect(isPathologicalMarkdown(`${'('.repeat(1000)}x`)).toBe(true);
    });

    describe('fenced code', () => {
        const deep = ')'.repeat(200);

        it('ignores long runs inside a closed fence', () => {
            expect(isPathologicalMarkdown(`text\n\n\`\`\`clojure\n(f ${deep}\n\`\`\`\n\nmore`)).toBe(false);
            expect(isPathologicalMarkdown(`~~~\n${'!'.repeat(200)}\n~~~`)).toBe(false);
        });

        it('ignores nested block-quote markers inside a fence', () => {
            expect(isPathologicalMarkdown(`\`\`\`\n${'> '.repeat(100)}x\n\`\`\``)).toBe(false);
        });

        it('ignores long runs inside an unclosed (streaming) fence', () => {
            expect(isPathologicalMarkdown(`\`\`\`lisp\n(f ${deep}`)).toBe(false);
        });

        it('still flags runs outside the fence, before and after', () => {
            expect(isPathologicalMarkdown(`${deep}\n\`\`\`\ncode\n\`\`\``)).toBe(true);
            expect(isPathologicalMarkdown(`\`\`\`\ncode\n\`\`\`\n${deep}`)).toBe(true);
        });

        it('needs a closing fence at least as long as the opener', () => {
            expect(isPathologicalMarkdown(`\`\`\`\`\n\`\`\`\n${deep}\n\`\`\`\`\n`)).toBe(false);
        });

        it('does not treat inline code with triple backticks as a fence', () => {
            expect(isPathologicalMarkdown(`\`\`\`x\`\`\` ${deep}`)).toBe(true);
        });
    });
});
