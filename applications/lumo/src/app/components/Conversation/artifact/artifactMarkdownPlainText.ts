import { markdownToHtmlBody } from './artifactMarkdownHtml';

const BLOCK_TAGS = new Set(['p', 'div', 'blockquote', 'pre', 'table', 'ul', 'ol']);

function getOrderedListItemIndex(listItem: HTMLElement): number {
    const parent = listItem.parentElement;

    if (!parent) {
        return 1;
    }

    return (
        Array.from(parent.children)
            .filter((child) => {
                return child.tagName.toLowerCase() === 'li';
            })
            .indexOf(listItem) + 1
    );
}

function nodeToPlainText(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent ?? '';
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
        return '';
    }

    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();

    if (tag === 'br') {
        return '\n';
    }

    const childText = Array.from(element.childNodes)
        .map((child) => {
            return nodeToPlainText(child);
        })
        .join('');

    if (/^h[1-6]$/.test(tag)) {
        return `${childText.trim()}\n\n`;
    }

    if (tag === 'li') {
        const parentTag = element.parentElement?.tagName.toLowerCase();
        const prefix = parentTag === 'ol' ? `${getOrderedListItemIndex(element)}. ` : '- ';
        return `${prefix}${childText.trim()}\n`;
    }

    if (tag === 'tr') {
        const cells = Array.from(element.querySelectorAll(':scope > th, :scope > td')).map((cell) => {
            return nodeToPlainText(cell).trim();
        });

        return `${cells.join('\t')}\n`;
    }

    if (tag === 'hr') {
        return '\n---\n\n';
    }

    if (BLOCK_TAGS.has(tag)) {
        return `${childText.trim()}\n\n`;
    }

    return childText;
}

/** Convert rendered HTML to readable plain text with paragraph and list structure preserved. */
export function htmlToPlainText(html: string): string {
    if (typeof document === 'undefined') {
        return html
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/(p|div|h[1-6]|li|tr|blockquote|pre)>/gi, '\n\n')
            .replace(/<[^>]+>/g, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    const doc = new DOMParser().parseFromString(html, 'text/html');

    return Array.from(doc.body.childNodes)
        .map((node) => {
            return nodeToPlainText(node);
        })
        .join('')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

/** Convert artifact markdown to plain text with headings, lists, and paragraphs formatted for reading. */
export function markdownToPlainText(markdown: string): string {
    return htmlToPlainText(markdownToHtmlBody(markdown));
}
