import { remarkLatexDelimiters, splitOnDelimiters } from './remarkLatexDelimiters';

const makeTree = (children: any[]) => ({ type: 'root', children });
const makeText = (value: string) => ({ type: 'text', value });
const makeParagraph = (children: any[]) => ({ type: 'paragraph', children });
const runPlugin = (tree: any) => {
    remarkLatexDelimiters()(tree);
    return tree;
};

describe('splitOnDelimiters', () => {
    it('converts \\[...\\] to a block math node', () => {
        expect(splitOnDelimiters('\\[x^2\\]')).toEqual([{ type: 'math', value: 'x^2' }]);
    });

    it('converts \\(...\\) to an inlineMath node', () => {
        expect(splitOnDelimiters('\\(x^2\\)')).toEqual([{ type: 'inlineMath', value: 'x^2' }]);
    });

    it('preserves surrounding text when splitting', () => {
        expect(splitOnDelimiters('See \\(F = ma\\) here')).toEqual([
            { type: 'text', value: 'See ' },
            { type: 'inlineMath', value: 'F = ma' },
            { type: 'text', value: ' here' },
        ]);
    });

    it('handles multiple delimiters in one string', () => {
        expect(splitOnDelimiters('\\(a+b\\) and \\[c+d\\]')).toEqual([
            { type: 'inlineMath', value: 'a+b' },
            { type: 'text', value: ' and ' },
            { type: 'math', value: 'c+d' },
        ]);
    });

    it('normalizes \\Bigl and \\Bigr inside math content', () => {
        expect(splitOnDelimiters('\\(\\Bigl( x \\Bigr)\\)')).toEqual([
            { type: 'inlineMath', value: '\\left( x \\right)' },
        ]);
    });

    it('returns a single text node when no delimiters are present', () => {
        expect(splitOnDelimiters('plain text')).toEqual([{ type: 'text', value: 'plain text' }]);
    });

    it('handles multiline block math content', () => {
        expect(splitOnDelimiters('\\[\n  x^2 + y^2\n\\]')).toEqual([{ type: 'math', value: '\n  x^2 + y^2\n' }]);
    });
});

describe('remarkLatexDelimiters', () => {
    it('converts \\(...\\) text node to inlineMath node in the AST', () => {
        const tree = makeTree([makeParagraph([makeText('\\(x^2\\)')])]);
        runPlugin(tree);
        expect(tree.children[0].children).toEqual([{ type: 'inlineMath', value: 'x^2' }]);
    });

    it('converts \\[...\\] text node to math node in the AST', () => {
        const tree = makeTree([makeParagraph([makeText('\\[x^2\\]')])]);
        runPlugin(tree);
        expect(tree.children[0].children).toEqual([{ type: 'math', value: 'x^2' }]);
    });

    it('splits a text node into text and math nodes', () => {
        const tree = makeTree([makeParagraph([makeText('See \\(F = ma\\) here')])]);
        runPlugin(tree);
        expect(tree.children[0].children).toEqual([
            { type: 'text', value: 'See ' },
            { type: 'inlineMath', value: 'F = ma' },
            { type: 'text', value: ' here' },
        ]);
    });

    it('does not modify text nodes with no LaTeX delimiters', () => {
        const tree = makeTree([makeParagraph([makeText('plain text')])]);
        runPlugin(tree);
        expect(tree.children[0].children).toEqual([{ type: 'text', value: 'plain text' }]);
    });

    // Regression test for bash variable corruption bug
    it('does not transform content inside fenced code blocks', () => {
        const codeNode = { type: 'code', lang: 'bash', value: 'DEST=$HOME/$FILE\n\\(x^2\\)' };
        const tree = makeTree([codeNode]);
        runPlugin(tree);
        expect(tree.children[0]).toEqual(codeNode);
    });

    it('does not transform content inside inline code spans', () => {
        const inlineCode = { type: 'inlineCode', value: '\\(x^2\\)' };
        const tree = makeTree([makeParagraph([inlineCode])]);
        runPlugin(tree);
        expect(tree.children[0].children[0]).toEqual(inlineCode);
    });
});
