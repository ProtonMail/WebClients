import type { Root } from 'hast';
import { visit } from 'unist-util-visit';

const TEXT_ELEMENTS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'th', 'td']);

export function rehypeAutoDirection() {
    return (tree: Root) => {
        visit(tree, 'element', (node) => {
            if (TEXT_ELEMENTS.has(node.tagName)) {
                node.properties.dir ??= 'auto';
            }
        });
    };
}
