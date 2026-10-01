import { Extension, Node, mergeAttributes } from '@tiptap/core';
import type { Extensions } from '@tiptap/core';
import { Code } from '@tiptap/extension-code';
import { Image } from '@tiptap/extension-image';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { TableKit } from '@tiptap/extension-table';
import { StarterKit } from '@tiptap/starter-kit';

import { RAW_MARKDOWN_BLOCK_NODE, RAW_MARKDOWN_INLINE_NODE } from '../../../util/markdown/markdownEditorDoc';

/**
 * Markdown the editor can't edit as rich text (raw HTML, footnotes, reference links…). Shown as its
 * source, read-only, and written back verbatim on save — see `markdownEditorDoc.ts`.
 */
const RawMarkdownBlock = Node.create({
    name: RAW_MARKDOWN_BLOCK_NODE,
    group: 'block',
    atom: true,
    selectable: true,
    draggable: false,
    addAttributes() {
        return {
            markdown: { default: '', rendered: false },
        };
    },
    parseHTML() {
        return [
            {
                tag: 'pre[data-raw-markdown]',
                getAttrs: (element) => {
                    return { markdown: element.textContent ?? '' };
                },
            },
        ];
    },
    renderHTML({ node, HTMLAttributes }) {
        return [
            'pre',
            mergeAttributes(HTMLAttributes, {
                'data-raw-markdown': '',
                class: 'artifact-editor-raw',
                contenteditable: 'false',
            }),
            node.attrs.markdown,
        ];
    },
});

const RawMarkdownInline = Node.create({
    name: RAW_MARKDOWN_INLINE_NODE,
    group: 'inline',
    inline: true,
    atom: true,
    selectable: true,
    draggable: false,
    addAttributes() {
        return {
            markdown: { default: '', rendered: false },
        };
    },
    parseHTML() {
        return [
            {
                tag: 'span[data-raw-markdown]',
                getAttrs: (element) => {
                    return { markdown: element.textContent ?? '' };
                },
            },
        ];
    },
    renderHTML({ node, HTMLAttributes }) {
        return [
            'span',
            mergeAttributes(HTMLAttributes, {
                'data-raw-markdown': '',
                class: 'artifact-editor-raw-inline',
                contenteditable: 'false',
            }),
            node.attrs.markdown,
        ];
    },
});

/** Markdown-only details (loose lists, column alignment) carried through editing so Save keeps them. */
const MarkdownAttributes = Extension.create({
    name: 'markdownAttributes',
    addGlobalAttributes() {
        return [
            {
                types: ['bulletList', 'orderedList', 'taskList'],
                attributes: { spread: { default: false, rendered: false } },
            },
            {
                types: ['table'],
                attributes: { align: { default: [], rendered: false } },
            },
        ];
    },
});

/**
 * The editor schema is limited to what GFM markdown — and so the preview and every export — can
 * represent. Underline is dropped (no markdown syntax), and inline code is allowed to combine with
 * other marks because markdown allows `**bold `code`**` and links around code.
 */
export const createArtifactEditorExtensions = (): Extensions => {
    return [
        StarterKit.configure({
            code: false,
            underline: false,
            link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
        }),
        Code.extend({ excludes: '' }),
        TaskList,
        TaskItem.configure({ nested: true }),
        TableKit.configure({ table: { resizable: false } }),
        Image.configure({ inline: true }),
        RawMarkdownBlock,
        RawMarkdownInline,
        MarkdownAttributes,
    ];
};
