import { SKIP, visit } from 'unist-util-visit';

/**
 * Normalizes fixed-size delimiter commands to auto-sizing equivalents.
 * \Bigl/\Bigr produce a fixed "Big" size; \left/\right auto-size to fit content.
 */
function normalizeParentheses(value: string): string {
    return value.replace(/\\Bigl/g, '\\left').replace(/\\Bigr/g, '\\right');
}

/**
 * Splits a text string on \[...\] and \(...\) LaTeX delimiters into an array
 * of text, math, and inlineMath AST nodes.
 */
export function splitOnDelimiters(text: string): any[] {
    const nodes: any[] = [];
    const pattern = /\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/g;
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
        if (match.index > lastIndex) {
            nodes.push({ type: 'text', value: text.slice(lastIndex, match.index) });
        }

        const isBlock = match[1] !== undefined;
        const value = normalizeParentheses(isBlock ? match[1] : match[2]);

        nodes.push({ type: isBlock ? 'math' : 'inlineMath', value });

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        nodes.push({ type: 'text', value: text.slice(lastIndex) });
    }

    return nodes.length > 0 ? nodes : [{ type: 'text', value: text }];
}

/**
 * Remark plugin that converts \[...\] and \(...\) LaTeX delimiters into
 * remark-math AST nodes (math and inlineMath respectively), and normalizes
 * \Bigl/\Bigr to \left/\right inside math content.
 *
 * Replaces the previous approach of regex-transforming the raw markdown string
 * before parsing. Operating on the AST means code blocks and inline code spans
 * are already isolated into their own node types and are never visited, so bash
 * variables and other $ patterns inside code are safe from transformation.
 */
export function remarkLatexDelimiters() {
    return (tree: any) => {
        visit(tree, 'text', (node: any, index: number | null | undefined, parent: any) => {
            if (!parent || typeof index !== 'number') {
                return;
            }

            const newNodes = splitOnDelimiters(node.value);

            if (newNodes.length === 1 && newNodes[0].type === 'text') {
                return;
            }

            parent.children.splice(index, 1, ...newNodes);
            return [SKIP, index + newNodes.length];
        });
    };
}
