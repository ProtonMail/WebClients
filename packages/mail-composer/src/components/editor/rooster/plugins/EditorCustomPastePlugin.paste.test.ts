import { Editor, Paste } from 'roosterjs';
import { formatContainerProcessor } from 'roosterjs-content-model-dom';
import { PastePlugin } from 'roosterjs-content-model-plugins';
import { EditorAdapter } from 'roosterjs-editor-adapter';
import type { ClipboardData, IEditor } from 'roosterjs-editor-types';

import { getProtonClassNamesDomToModelOption, protonClassNamesModelToDomOption } from '../helpers/protonClassNames';
import EditorCustomPastePlugin from './EditorCustomPastePlugin';

const createEditors: Record<string, (element: HTMLDivElement) => IEditor> = {
    'roosterjs 8': (element) => new Editor(element, { plugins: [new Paste(), new EditorCustomPastePlugin(() => {})] }),
    'roosterjs 9': (element) =>
        new EditorAdapter(element, {
            plugins: [new PastePlugin()],
            legacyPlugins: [new EditorCustomPastePlugin(() => {})],
            defaultDomToModelOptions: getProtonClassNamesDomToModelOption(formatContainerProcessor),
            defaultModelToDomOptions: protonClassNamesModelToDomOption,
        }),
};

describe.each(Object.keys(createEditors))('pasting HTML with %s', (version) => {
    let element: HTMLDivElement;
    let editor: IEditor;

    beforeAll(() => {
        // Not implemented by jsdom, and read by roosterjs 9 to scroll to the pasted content
        Range.prototype.getBoundingClientRect ??= () => ({}) as DOMRect;
        Range.prototype.getClientRects ??= () => [] as unknown as DOMRectList;
    });

    beforeEach(() => {
        element = document.createElement('div');
        element.tabIndex = 0;
        document.body.append(element);
        editor = createEditors[version](element);
        editor.focus();
    });

    afterEach(() => {
        editor.dispose();
        element.remove();
    });

    const pasteHTML = (rawHtml: string) => {
        editor.paste({ types: ['text/html'], text: '', rawHtml, image: null, customValues: {} } as ClipboardData);
    };

    it('should keep the links whose protocol is allowed only', () => {
        pasteHTML(
            [
                '<a href="javascript:alert(1)">js</a>',
                '<a href="vbscript:msgbox(1)">vb</a>',
                '<a href="data:text/html,<script>alert(1)</script>">data</a>',
                '<a href="ftp://example.com/f">ftp</a>',
                '<a href="https://example.com/ok">ok</a>',
                '<a href="mailto:a@example.com">mail</a>',
            ].join(' ')
        );

        const hrefs = Array.from(element.querySelectorAll('[href]')).map((link) => link.getAttribute('href'));
        expect(hrefs).toEqual(['https://example.com/ok', 'mailto:a@example.com']);
        expect(element.textContent).toContain('ftp');
    });

    it('should remove forms, their fields and active content', () => {
        pasteHTML(
            [
                '<div>before</div>',
                '<form action="https://example.test"><input value="secret"><textarea>t</textarea><button>b</button></form>',
                '<input value="loose"><textarea>loose</textarea>',
                '<div onclick="alert(1)">click</div>',
                '<iframe src="https://example.test"></iframe><script>alert(1)</script>',
            ].join('')
        );

        expect(element.querySelector('form, input, textarea, button, iframe, script')).toBeNull();
        expect(element.querySelector('[onclick]')).toBeNull();
        expect(element.textContent).toContain('before');
        expect(element.textContent).toContain('click');
    });

    it('should not paste a signature or a quote that mail would find', () => {
        pasteHTML(
            '<div class="protonmail_signature_block"><div class="protonmail_signature_block-user">Signature</div></div><blockquote class="protonmail_quote">Quote</blockquote>'
        );

        expect(element.querySelector('[class*="protonmail_"]')).toBeNull();
        expect(element.textContent).toContain('Signature');
        expect(element.textContent).toContain('Quote');
    });
});
