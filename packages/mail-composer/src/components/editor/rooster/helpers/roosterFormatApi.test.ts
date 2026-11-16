import { Editor } from 'roosterjs';
import { EditorAdapter } from 'roosterjs-editor-adapter';
import type { IEditor } from 'roosterjs-editor-types';

import { DIRECTION } from '@proton/shared/lib/mail/mailSettings';

import { loadRoosterV8FormatApi, loadRoosterV9FormatApi } from './roosterFormatApi';

describe.each([
    {
        version: 'roosterjs 8',
        createEditor: (element: HTMLDivElement) => new Editor(element),
        load: loadRoosterV8FormatApi,
    },
    {
        version: 'roosterjs 9',
        createEditor: (element: HTMLDivElement) => new EditorAdapter(element),
        load: loadRoosterV9FormatApi,
    },
])('roosterFormatApi with $version', ({ createEditor, load }) => {
    let element: HTMLDivElement;
    let editor: IEditor;

    beforeEach(() => {
        element = document.createElement('div');
        element.tabIndex = 0;
        document.body.append(element);
        editor = createEditor(element);
    });

    afterEach(() => {
        editor.dispose();
        element.remove();
    });

    const selectStartOf = (node: Node) => {
        const range = document.createRange();
        range.setStart(node, 0);
        editor.select(range);
    };

    it('sets the direction of the first line when nothing is selected', async () => {
        const api = await load();
        editor.setContent('<div><br></div><div><br></div><div class="protonmail_signature_block">Signature</div>');

        api.setDirection(editor, DIRECTION.RIGHT_TO_LEFT);

        const [firstLine] = element.querySelectorAll('div');
        expect(getComputedStyle(firstLine).direction).toBe('rtl');
    });

    it('keeps the previous quote when quoting and then unquoting the next paragraph', async () => {
        // roosterjs 9 merges quotes with the same format, so both quotes must come from the toolbar
        const api = await load();
        editor.setContent('<div>Stays quoted</div><div>Gets unquoted</div>');
        const selectParagraph = (text: string) =>
            selectStartOf([...element.querySelectorAll('div')].find((div) => div.textContent === text)!.firstChild!);

        selectParagraph('Stays quoted');
        api.toggleBlockQuote(editor);
        selectParagraph('Gets unquoted');
        api.toggleBlockQuote(editor);
        selectParagraph('Gets unquoted');
        api.toggleBlockQuote(editor);

        const quotes = [...element.querySelectorAll('blockquote')].map((quote) => quote.textContent);
        expect(quotes).toEqual(['Stays quoted']);
        expect(element.textContent).toBe('Stays quotedGets unquoted');
    });

    it('quotes an unquoted paragraph', async () => {
        const api = await load();
        editor.setContent('<div>Plain</div>');
        selectStartOf(element.querySelector('div')!.firstChild!);

        api.toggleBlockQuote(editor);

        expect(element.querySelector('blockquote')?.textContent).toBe('Plain');
    });
});

describe('roosterFormatApi with roosterjs 9', () => {
    it('unquotes the selected paragraph of a quote and keeps the paragraphs around it quoted', async () => {
        const element = document.createElement('div');
        document.body.append(element);
        const editor = new EditorAdapter(element);
        const api = await loadRoosterV9FormatApi();
        editor.setContent('<blockquote><div>First</div><div>Middle</div><div>Last</div></blockquote>');
        const range = document.createRange();
        range.setStart(element.querySelectorAll('blockquote > div')[1].firstChild!, 0);
        editor.select(range);

        api.toggleBlockQuote(editor);

        const quotes = [...element.querySelectorAll('blockquote')].map((quote) => quote.textContent);
        expect(quotes).toEqual(['First', 'Last']);
        expect(element.textContent).toBe('FirstMiddleLast');
        editor.dispose();
        element.remove();
    });
});
