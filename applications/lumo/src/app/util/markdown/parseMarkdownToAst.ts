import type { Root } from 'mdast';

/**
 * Parse markdown into an mdast syntax tree with the same dialect the document preview renders
 * (CommonMark + GFM: tables, strikethrough, task lists, autolinks, footnotes). The parser is
 * loaded on demand so it only costs bytes when an export needs it.
 */
export async function parseMarkdownToAst(markdown: string): Promise<Root> {
    const [{ unified }, { default: remarkParse }, { default: remarkGfm }] = await Promise.all([
        import(/* webpackChunkName: "markdown-ast" */ 'unified'),
        import(/* webpackChunkName: "markdown-ast" */ 'remark-parse'),
        import(/* webpackChunkName: "markdown-ast" */ 'remark-gfm'),
    ]);

    // remark-gfm only extends the parser (it adds no transforms), so parsing alone yields the full tree.
    return unified().use(remarkParse).use(remarkGfm).parse(markdown);
}
