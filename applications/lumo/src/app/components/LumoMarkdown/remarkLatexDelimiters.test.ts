import { remarkLatexDelimiters, splitOnDelimiters } from './remarkLatexDelimiters';

const makeTree = (children: any[]) => ({ type: 'root', children });
const makeText = (value: string) => ({ type: 'text', value });
const makeParagraph = (children: any[]) => ({ type: 'paragraph', children });
const runPlugin = (tree: any) => {
    remarkLatexDelimiters()(tree);
    return tree;
};

const makeInlineMath = (value: string) => ({
    type: 'inlineMath',
    value,
    data: {
        hName: 'code',
        hProperties: { className: ['language-math', 'math-inline'] },
        hChildren: [{ type: 'text', value }],
    },
});

const makeBlockMath = (value: string) => ({
    type: 'math',
    value,
    data: {
        hName: 'pre',
        hChildren: [
            {
                type: 'element',
                tagName: 'code',
                properties: { className: ['language-math', 'math-display'] },
                children: [{ type: 'text', value }],
            },
        ],
    },
});

describe('splitOnDelimiters', () => {
    it('converts \\[...\\] to a block math node', () => {
        expect(splitOnDelimiters('\\[x^2\\]')).toEqual([makeBlockMath('x^2')]);
    });

    it('converts \\(...\\) to an inlineMath node', () => {
        expect(splitOnDelimiters('\\(x^2\\)')).toEqual([makeInlineMath('x^2')]);
    });

    it('preserves surrounding text when splitting', () => {
        expect(splitOnDelimiters('See \\(F = ma\\) here')).toEqual([
            { type: 'text', value: 'See ' },
            makeInlineMath('F = ma'),
            { type: 'text', value: ' here' },
        ]);
    });

    it('handles multiple delimiters in one string', () => {
        expect(splitOnDelimiters('\\(a+b\\) and \\[c+d\\]')).toEqual([
            makeInlineMath('a+b'),
            { type: 'text', value: ' and ' },
            makeBlockMath('c+d'),
        ]);
    });

    it('normalizes \\Bigl and \\Bigr inside math content', () => {
        expect(splitOnDelimiters('\\(\\Bigl( x \\Bigr)\\)')).toEqual([makeInlineMath('\\left( x \\right)')]);
    });

    it('returns a single text node when no delimiters are present', () => {
        expect(splitOnDelimiters('plain text')).toEqual([{ type: 'text', value: 'plain text' }]);
    });

    it('handles multiline block math content', () => {
        expect(splitOnDelimiters('\\[\n  x^2 + y^2\n\\]')).toEqual([makeBlockMath('\n  x^2 + y^2\n')]);
    });

    it('converts $...$ to an inlineMath node when content does not start with a digit', () => {
        expect(splitOnDelimiters('$x^2$')).toEqual([makeInlineMath('x^2')]);
    });

    it('does not convert $...$ when content starts with a digit (currency)', () => {
        expect(splitOnDelimiters('$500')).toEqual([{ type: 'text', value: '$500' }]);
        expect(splitOnDelimiters('costs $30,000 total')).toEqual([{ type: 'text', value: 'costs $30,000 total' }]);
    });

    it('does not span $...$ across newlines', () => {
        expect(splitOnDelimiters('$x\ny$')).toEqual([{ type: 'text', value: '$x\ny$' }]);
    });

    it('does not match two separate currency values as inline math', () => {
        expect(splitOnDelimiters('between $5 and $10')).toEqual([{ type: 'text', value: 'between $5 and $10' }]);
    });
});

describe('remarkLatexDelimiters', () => {
    it('converts \\(...\\) text node to inlineMath node in the AST', () => {
        const tree = makeTree([makeParagraph([makeText('\\(x^2\\)')])]);
        runPlugin(tree);
        expect(tree.children[0].children).toEqual([makeInlineMath('x^2')]);
    });

    it('converts \\[...\\] text node to math node in the AST', () => {
        const tree = makeTree([makeParagraph([makeText('\\[x^2\\]')])]);
        runPlugin(tree);
        expect(tree.children[0].children).toEqual([makeBlockMath('x^2')]);
    });

    it('splits a text node into text and math nodes', () => {
        const tree = makeTree([makeParagraph([makeText('See \\(F = ma\\) here')])]);
        runPlugin(tree);
        expect(tree.children[0].children).toEqual([
            { type: 'text', value: 'See ' },
            makeInlineMath('F = ma'),
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
