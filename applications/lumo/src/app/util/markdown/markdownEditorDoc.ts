import type { JSONContent } from '@tiptap/core';
import type {
    AlignType,
    BlockContent,
    Code,
    DefinitionContent,
    Heading,
    Html,
    List,
    ListItem,
    Nodes,
    Paragraph,
    PhrasingContent,
    Root,
    RootContent,
    Table,
    TableCell,
    TableRow,
} from 'mdast';
import { gfmToMarkdown } from 'mdast-util-gfm';
import { toMarkdown } from 'mdast-util-to-markdown';

import { parseMarkdownToAst } from './parseMarkdownToAst';

/**
 * Converts between artifact markdown and the rich-text editor's document (tiptap JSON), using the
 * same mdast tree the preview and the Word export read (`parseMarkdownToAst`). Markdown stays the
 * source of truth: the editor only ever holds a projection of it, and Save writes markdown back.
 *
 * Constructs the editor has no editing UI for — raw HTML, footnotes, reference-style links and
 * their definitions, code fences with meta, mixed task/plain lists — become read-only "raw" nodes
 * that carry their original markdown and are written back verbatim, so editing a document never
 * silently drops content.
 */

export const RAW_MARKDOWN_BLOCK_NODE = 'rawMarkdownBlock';
export const RAW_MARKDOWN_INLINE_NODE = 'rawMarkdownInline';

type EditorMark = NonNullable<JSONContent['marks']>[number];

// ---------------------------------------------------------------------------
// markdown → editor document
// ---------------------------------------------------------------------------

const getSourceSlice = (source: string, node: Nodes): string => {
    const start = node.position?.start.offset;
    const end = node.position?.end.offset;
    if (start === undefined || end === undefined) {
        return '';
    }
    return source.slice(start, end);
};

const createRawBlock = (source: string, node: Nodes): JSONContent => {
    return { type: RAW_MARKDOWN_BLOCK_NODE, attrs: { markdown: getSourceSlice(source, node) } };
};

const withMarks = (node: JSONContent, marks: EditorMark[]): JSONContent => {
    if (marks.length === 0) {
        return node;
    }
    return { ...node, marks };
};

const convertInline = (source: string, nodes: PhrasingContent[], marks: EditorMark[]): JSONContent[] => {
    return nodes.flatMap((node): JSONContent[] => {
        switch (node.type) {
            case 'text': {
                // A soft line break renders as a space in the preview, so show it as one while editing
                // rather than as a visual line break the preview doesn't have.
                const text = node.value.replace(/\n/g, ' ');
                if (!text) {
                    return [];
                }
                return [withMarks({ type: 'text', text }, marks)];
            }
            case 'emphasis': {
                return convertInline(source, node.children, [...marks, { type: 'italic' }]);
            }
            case 'strong': {
                return convertInline(source, node.children, [...marks, { type: 'bold' }]);
            }
            case 'delete': {
                return convertInline(source, node.children, [...marks, { type: 'strike' }]);
            }
            case 'inlineCode': {
                if (!node.value) {
                    return [];
                }
                return [withMarks({ type: 'text', text: node.value }, [...marks, { type: 'code' }])];
            }
            case 'link': {
                return convertInline(source, node.children, [
                    ...marks,
                    { type: 'link', attrs: { href: node.url, title: node.title ?? null } },
                ]);
            }
            case 'image': {
                return [
                    withMarks(
                        { type: 'image', attrs: { src: node.url, alt: node.alt ?? null, title: node.title ?? null } },
                        marks
                    ),
                ];
            }
            case 'break': {
                return [{ type: 'hardBreak' }];
            }
            default: {
                // html, footnoteReference, linkReference, imageReference
                return [
                    withMarks(
                        { type: RAW_MARKDOWN_INLINE_NODE, attrs: { markdown: getSourceSlice(source, node) } },
                        marks
                    ),
                ];
            }
        }
    });
};

const createParagraph = (content: JSONContent[]): JSONContent => {
    if (content.length === 0) {
        return { type: 'paragraph' };
    }
    return { type: 'paragraph', content };
};

const convertListItems = (source: string, list: List): JSONContent[] | null => {
    const items: JSONContent[] = [];
    for (const item of list.children) {
        const content = convertBlocks(source, item.children);
        if (content.length === 0) {
            content.push({ type: 'paragraph' });
        }
        // List items must start with a paragraph in the editor schema; anything else (an item
        // opening with a code fence, say) is kept as raw markdown by the caller.
        if (content[0].type !== 'paragraph') {
            return null;
        }
        items.push({ type: 'listItem', content });
    }
    return items;
};

const convertList = (source: string, list: List): JSONContent => {
    const taskItemCount = list.children.filter((item) => {
        return typeof item.checked === 'boolean';
    }).length;
    const isTaskList = taskItemCount > 0 && taskItemCount === list.children.length;
    if (taskItemCount > 0 && !isTaskList) {
        return createRawBlock(source, list);
    }

    const items = convertListItems(source, list);
    if (!items) {
        return createRawBlock(source, list);
    }

    const spread = Boolean(list.spread);
    if (isTaskList) {
        return {
            type: 'taskList',
            attrs: { spread },
            content: items.map((item, index) => {
                return { ...item, type: 'taskItem', attrs: { checked: Boolean(list.children[index].checked) } };
            }),
        };
    }
    if (list.ordered) {
        return { type: 'orderedList', attrs: { start: list.start ?? 1, spread }, content: items };
    }
    return { type: 'bulletList', attrs: { spread }, content: items };
};

const convertTable = (source: string, table: Table): JSONContent => {
    const columnCount = Math.max(
        0,
        ...table.children.map((row) => {
            return row.children.length;
        })
    );

    const rows = table.children.map((row, rowIndex): JSONContent => {
        const cellType = rowIndex === 0 ? 'tableHeader' : 'tableCell';
        const cells = row.children.map((cell): JSONContent => {
            return { type: cellType, content: [createParagraph(convertInline(source, cell.children, []))] };
        });
        // The editor's table model is rectangular; pad short rows the same way the renderer does.
        while (cells.length < columnCount) {
            cells.push({ type: cellType, content: [{ type: 'paragraph' }] });
        }
        return { type: 'tableRow', content: cells };
    });

    return { type: 'table', attrs: { align: table.align ?? [] }, content: rows };
};

const convertBlock = (source: string, node: RootContent): JSONContent[] => {
    switch (node.type) {
        case 'paragraph': {
            return [createParagraph(convertInline(source, node.children, []))];
        }
        case 'heading': {
            return [
                { type: 'heading', attrs: { level: node.depth }, content: convertInline(source, node.children, []) },
            ];
        }
        case 'blockquote': {
            const content = convertBlocks(source, node.children);
            return [{ type: 'blockquote', content: content.length > 0 ? content : [{ type: 'paragraph' }] }];
        }
        case 'list': {
            return [convertList(source, node)];
        }
        case 'code': {
            if (node.meta) {
                return [createRawBlock(source, node)];
            }
            return [
                {
                    type: 'codeBlock',
                    attrs: { language: node.lang ?? null },
                    content: node.value ? [{ type: 'text', text: node.value }] : undefined,
                },
            ];
        }
        case 'thematicBreak': {
            return [{ type: 'horizontalRule' }];
        }
        case 'table': {
            return [convertTable(source, node)];
        }
        default: {
            // html, definition, footnoteDefinition, and anything a future parser plugin adds
            return [createRawBlock(source, node)];
        }
    }
};

const convertBlocks = (source: string, nodes: RootContent[]): JSONContent[] => {
    return nodes.flatMap((node) => {
        return convertBlock(source, node);
    });
};

/** Converts a parsed markdown tree into the editor document. `source` is the markdown `root` was parsed from. */
export function markdownAstToEditorDoc(source: string, root: Root): JSONContent {
    const content = convertBlocks(source, root.children);
    return { type: 'doc', content: content.length > 0 ? content : [{ type: 'paragraph' }] };
}

export async function markdownToEditorDoc(markdown: string): Promise<JSONContent> {
    return markdownAstToEditorDoc(markdown, await parseMarkdownToAst(markdown));
}

// ---------------------------------------------------------------------------
// editor document → markdown
// ---------------------------------------------------------------------------

// Outermost first: a link wraps bold text rather than bold wrapping several one-word links.
const MARK_ORDER = ['link', 'bold', 'italic', 'strike'];

type MarkWrapper = Extract<PhrasingContent, { type: 'link' | 'strong' | 'emphasis' | 'delete' }>;

const getMarkKey = (mark: EditorMark): string => {
    if (mark.type === 'link') {
        return `link:${mark.attrs?.href ?? ''}:${mark.attrs?.title ?? ''}`;
    }
    return mark.type;
};

const createMarkWrapper = (mark: EditorMark): MarkWrapper => {
    switch (mark.type) {
        case 'link': {
            return { type: 'link', url: mark.attrs?.href ?? '', title: mark.attrs?.title ?? null, children: [] };
        }
        case 'bold': {
            return { type: 'strong', children: [] };
        }
        case 'italic': {
            return { type: 'emphasis', children: [] };
        }
        default: {
            return { type: 'delete', children: [] };
        }
    }
};

const getText = (node: JSONContent): string => {
    if (node.type === 'text') {
        return node.text ?? '';
    }
    if (node.type === 'hardBreak') {
        return ' ';
    }
    return (node.content ?? [])
        .map((child) => {
            return getText(child);
        })
        .join('');
};

const toPhrasingLeaf = (node: JSONContent): PhrasingContent | null => {
    switch (node.type) {
        case 'text': {
            const text = node.text ?? '';
            if (!text) {
                return null;
            }
            const isCode = (node.marks ?? []).some((mark) => {
                return mark.type === 'code';
            });
            return isCode ? { type: 'inlineCode', value: text } : { type: 'text', value: text };
        }
        case 'hardBreak': {
            return { type: 'break' };
        }
        case 'image': {
            return {
                type: 'image',
                url: node.attrs?.src ?? '',
                alt: node.attrs?.alt ?? null,
                title: node.attrs?.title ?? null,
            };
        }
        case RAW_MARKDOWN_INLINE_NODE: {
            return { type: 'html', value: node.attrs?.markdown ?? '' };
        }
        default: {
            return null;
        }
    }
};

/**
 * Rebuilds mdast's nested phrasing tree from the editor's flat, mark-annotated inline nodes, keeping
 * one wrapper open across adjacent nodes that share it (so `**a `b` c**` stays one strong node).
 */
const toPhrasing = (nodes: JSONContent[] = []): PhrasingContent[] => {
    const root: PhrasingContent[] = [];
    const stack: { key: string; children: PhrasingContent[] }[] = [];

    for (const node of nodes) {
        const leaf = toPhrasingLeaf(node);
        if (!leaf) {
            continue;
        }

        const marks = (node.marks ?? [])
            .filter((mark) => {
                return MARK_ORDER.includes(mark.type);
            })
            .sort((a, b) => {
                return MARK_ORDER.indexOf(a.type) - MARK_ORDER.indexOf(b.type);
            });

        let shared = 0;
        while (shared < stack.length && shared < marks.length && stack[shared].key === getMarkKey(marks[shared])) {
            shared += 1;
        }
        stack.length = shared;

        for (let index = shared; index < marks.length; index += 1) {
            const wrapper = createMarkWrapper(marks[index]);
            const parent = index === 0 ? root : stack[index - 1].children;
            parent.push(wrapper);
            stack.push({ key: getMarkKey(marks[index]), children: wrapper.children });
        }

        const target = stack.length > 0 ? stack[stack.length - 1].children : root;
        target.push(leaf);
    }

    return root;
};

const toTableCellPhrasing = (cell: JSONContent): PhrasingContent[] => {
    // A GFM cell holds one line of inline content. Paragraphs the user split a cell into are joined
    // with <br> (which the preview renders); any other block pasted into a cell keeps only its text.
    const phrasing: PhrasingContent[] = [];
    for (const block of cell.content ?? []) {
        const children: PhrasingContent[] =
            block.type === 'paragraph' ? toPhrasing(block.content) : [{ type: 'text', value: getText(block) }];
        if (children.length === 0) {
            continue;
        }
        if (phrasing.length > 0) {
            phrasing.push({ type: 'html', value: '<br>' });
        }
        phrasing.push(...children);
    }
    return phrasing;
};

const toTable = (node: JSONContent): Table => {
    const rows = (node.content ?? []).map((row): TableRow => {
        const cells: TableCell[] = [];
        for (const cell of row.content ?? []) {
            cells.push({ type: 'tableCell', children: toTableCellPhrasing(cell) });
            const colspan = Number(cell.attrs?.colspan ?? 1);
            for (let extra = 1; extra < colspan; extra += 1) {
                cells.push({ type: 'tableCell', children: [] });
            }
        }
        return { type: 'tableRow', children: cells };
    });
    const align = Array.isArray(node.attrs?.align) ? (node.attrs.align as AlignType[]) : null;
    return { type: 'table', align, children: rows };
};

const toList = (node: JSONContent): List => {
    const spread = Boolean(node.attrs?.spread);
    const isTaskList = node.type === 'taskList';
    const children = (node.content ?? []).map((item): ListItem => {
        return {
            type: 'listItem',
            spread,
            checked: isTaskList ? Boolean(item.attrs?.checked) : null,
            children: toBlocks(item.content) as ListItem['children'],
        };
    });

    if (node.type === 'orderedList') {
        return { type: 'list', ordered: true, start: Number(node.attrs?.start ?? 1), spread, children };
    }
    return { type: 'list', ordered: false, spread, children };
};

const toBlock = (node: JSONContent): (BlockContent | DefinitionContent)[] => {
    switch (node.type) {
        case 'paragraph': {
            const children = toPhrasing(node.content);
            if (children.length === 0) {
                // Markdown has no empty paragraph; blank lines the user typed collapse away.
                return [];
            }
            const paragraph: Paragraph = { type: 'paragraph', children };
            return [paragraph];
        }
        case 'heading': {
            const level = Math.min(6, Math.max(1, Number(node.attrs?.level ?? 1))) as Heading['depth'];
            return [{ type: 'heading', depth: level, children: toPhrasing(node.content) }];
        }
        case 'blockquote': {
            const children = toBlocks(node.content);
            if (children.length === 0) {
                return [];
            }
            return [{ type: 'blockquote', children }];
        }
        case 'bulletList':
        case 'orderedList':
        case 'taskList': {
            return [toList(node)];
        }
        case 'codeBlock': {
            const code: Code = { type: 'code', lang: node.attrs?.language || null, value: getText(node) };
            return [code];
        }
        case 'horizontalRule': {
            return [{ type: 'thematicBreak' }];
        }
        case 'table': {
            return [toTable(node)];
        }
        case RAW_MARKDOWN_BLOCK_NODE: {
            const html: Html = { type: 'html', value: node.attrs?.markdown ?? '' };
            return [html];
        }
        case 'image': {
            const leaf = toPhrasingLeaf(node);
            return leaf ? [{ type: 'paragraph', children: [leaf] }] : [];
        }
        default: {
            return toBlocks(node.content);
        }
    }
};

const toBlocks = (nodes: JSONContent[] = []): (BlockContent | DefinitionContent)[] => {
    return nodes.flatMap((node) => {
        return toBlock(node);
    });
};

/**
 * Markdown style matches what the model writes by default (`-` bullets, `*` emphasis, fenced code),
 * so a manual edit doesn't restyle every untouched line of the document.
 */
export function editorDocToMarkdown(doc: JSONContent): string {
    const root: Root = { type: 'root', children: toBlocks(doc.content) };
    const markdown = toMarkdown(root, {
        extensions: [gfmToMarkdown({ tablePipeAlign: false })],
        bullet: '-',
        emphasis: '*',
        strong: '*',
        rule: '-',
        fences: true,
        listItemIndent: 'one',
    });
    return markdown.replace(/\n+$/, '');
}

/**
 * The markdown the editor would save if the user changed nothing. The serializer writes markdown
 * in its own style, so this — not the original — is the baseline for "has the user edited it".
 */
export async function normalizeMarkdownForEditor(markdown: string): Promise<string> {
    return editorDocToMarkdown(await markdownToEditorDoc(markdown));
}
