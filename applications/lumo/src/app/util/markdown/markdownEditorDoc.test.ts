import { getSchema } from '@tiptap/core';
import type { JSONContent } from '@tiptap/core';

import { createArtifactEditorExtensions } from '../../components/Conversation/artifact/artifactEditorExtensions';
import { editorDocToMarkdown, markdownToEditorDoc, normalizeMarkdownForEditor } from './markdownEditorDoc';

const schema = getSchema(createArtifactEditorExtensions());

const toEditorDoc = async (markdown: string): Promise<JSONContent> => {
    const doc = await markdownToEditorDoc(markdown);
    // Throws when the converter produces content the editor schema would reject.
    schema.nodeFromJSON(doc).check();
    return doc;
};

const roundTrip = async (markdown: string): Promise<string> => {
    return editorDocToMarkdown(await toEditorDoc(markdown));
};

describe('markdownEditorDoc', () => {
    it('round-trips the model’s usual document markdown unchanged', async () => {
        const markdown = [
            '# Ham Party Invitation',
            '',
            'Subject: Ham Party at My Place this **Friday**!',
            '',
            'Hope you’re *all* having a great week. Visit [our site](https://proton.me "Proton") or run `yarn start`.',
            '',
            '## Plan',
            '',
            '- Good food',
            '- Good drinks',
            '  - nested item',
            '',
            '1. How many people',
            '2. What drinks',
            '',
            '> Quoted text',
            '',
            '```ts',
            'const x = 1;',
            '```',
            '',
            '---',
            '',
            '~~old~~ new',
        ].join('\n');

        expect(await roundTrip(markdown)).toBe(markdown);
    });

    it('keeps GFM tables, alignment and task lists', async () => {
        const markdown = [
            '| Plan | Price |',
            '| :--- | ----: |',
            '| Plus | $9 |',
            '| Free | $0 |',
            '',
            '- [ ] invite friends',
            '- [x] buy ham',
        ].join('\n');

        // Alignment survives; only the delimiter row is written in its shortest form.
        expect(await roundTrip(markdown)).toBe(markdown.replace('| :--- | ----: |', '| :- | -: |'));
    });

    it('pads short table rows so the editor table stays rectangular', async () => {
        const doc = await toEditorDoc('| a | b |\n| - | - |\n| 1 |');
        const lastRow = doc.content?.[0].content?.[1];

        expect(lastRow?.content).toHaveLength(2);
    });

    it('keeps constructs without rich-text editing as verbatim raw markdown', async () => {
        const markdown = [
            'A claim[^1] and a [ref link][docs].',
            '',
            '<div align="center">centered</div>',
            '',
            '```js title="example.js"',
            'run();',
            '```',
            '',
            '[^1]: The source.',
            '',
            '[docs]: https://proton.me',
        ].join('\n');

        const doc = await toEditorDoc(markdown);
        const types = doc.content?.map((node) => {
            return node.type;
        });

        expect(types).toEqual([
            'paragraph',
            'rawMarkdownBlock',
            'rawMarkdownBlock',
            'rawMarkdownBlock',
            'rawMarkdownBlock',
        ]);
        expect(editorDocToMarkdown(doc)).toBe(markdown);
    });

    it('keeps a list mixing task and plain items as raw markdown', async () => {
        const markdown = '- [ ] task\n- plain';
        const doc = await toEditorDoc(markdown);

        expect(doc.content?.[0].type).toBe('rawMarkdownBlock');
        expect(editorDocToMarkdown(doc)).toBe(markdown);
    });

    it('keeps one wrapper across adjacent nodes sharing a mark', async () => {
        expect(await roundTrip('**bold `code` bold**')).toBe('**bold `code` bold**');
        expect(await roundTrip('[**bold** link](https://proton.me)')).toBe('[**bold** link](https://proton.me)');
    });

    it('shows soft line breaks as spaces, matching the preview', async () => {
        expect(await roundTrip('Cheers,\n[Your Name]')).toBe('Cheers, \\[Your Name]');
    });

    it('drops empty paragraphs the user typed', () => {
        const doc: JSONContent = {
            type: 'doc',
            content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'one' }] },
                { type: 'paragraph' },
                { type: 'paragraph' },
                { type: 'paragraph', content: [{ type: 'text', text: 'two' }] },
            ],
        };

        expect(editorDocToMarkdown(doc)).toBe('one\n\ntwo');
    });

    it('serializes user edits made through the editor’s node types', () => {
        const doc: JSONContent = {
            type: 'doc',
            content: [
                { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'New' }] },
                {
                    type: 'paragraph',
                    content: [
                        { type: 'text', text: 'plain ' },
                        { type: 'text', text: 'both', marks: [{ type: 'italic' }, { type: 'bold' }] },
                        { type: 'hardBreak' },
                        { type: 'text', text: 'next' },
                    ],
                },
                {
                    type: 'table',
                    content: [
                        {
                            type: 'tableRow',
                            content: [
                                {
                                    type: 'tableHeader',
                                    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'h' }] }],
                                },
                            ],
                        },
                        {
                            type: 'tableRow',
                            content: [
                                {
                                    type: 'tableCell',
                                    content: [
                                        { type: 'paragraph', content: [{ type: 'text', text: 'a' }] },
                                        { type: 'paragraph', content: [{ type: 'text', text: 'b' }] },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        expect(editorDocToMarkdown(doc)).toBe('## New\n\nplain ***both***\\\nnext\n\n| h |\n| - |\n| a<br>b |');
    });

    it('normalizes to the same markdown on every pass', async () => {
        const markdown = '* star bullet\n* second\n\n__strong__ and _em_\n\nSetext\n======';
        const once = await normalizeMarkdownForEditor(markdown);

        expect(once).toBe('- star bullet\n- second\n\n**strong** and *em*\n\n# Setext');
        expect(await normalizeMarkdownForEditor(once)).toBe(once);
    });
});
