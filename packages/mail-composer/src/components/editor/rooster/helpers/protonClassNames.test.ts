import { toggleBold } from 'roosterjs-content-model-api';
import { formatContainerProcessor } from 'roosterjs-content-model-dom';
import { EditorAdapter } from 'roosterjs-editor-adapter';

import { getProtonClassNamesDomToModelOption, protonClassNamesModelToDomOption } from './protonClassNames';

const SIGNATURE =
    '<div class="protonmail_signature_block"><div class="protonmail_signature_block-user">Signature</div><div class="protonmail_signature_block-proton protonmail_signature_block-empty"></div></div>';
const QUOTE = '<div class="protonmail_quote"><blockquote class="protonmail_quote">Quote</blockquote></div>';
const IMAGE = '<img class="proton-embedded" src="https://example.test/a.png">';

describe('protonClassNames', () => {
    let element: HTMLDivElement;
    let editor: EditorAdapter;

    const createEditor = (initialContent: string, keepClassNames = true) => {
        editor = new EditorAdapter(element, {
            initialContent,
            ...(keepClassNames && {
                defaultDomToModelOptions: getProtonClassNamesDomToModelOption(formatContainerProcessor),
                defaultModelToDomOptions: protonClassNamesModelToDomOption,
            }),
        });
        editor.focus();
    };

    const getClassNames = () =>
        Array.from(element.querySelectorAll('[class]')).map((child) => child.getAttribute('class'));

    const EXPECTED_CLASS_NAMES = [
        'protonmail_signature_block',
        'protonmail_signature_block-user',
        'protonmail_signature_block-proton protonmail_signature_block-empty',
        'protonmail_quote',
        'protonmail_quote',
        'proton-embedded',
    ];

    beforeEach(() => {
        element = document.createElement('div');
        element.tabIndex = 0;
        document.body.append(element);
    });

    afterEach(() => {
        editor.dispose();
        element.remove();
    });

    it('should be needed, as roosterjs 9 drops the classes otherwise', () => {
        createEditor(`<div>Text</div>${SIGNATURE}${QUOTE}<div>${IMAGE}</div>`, false);
        editor.formatContentModel(() => true);

        expect(element.querySelector('.protonmail_signature_block, .proton-embedded')).toBeNull();
    });

    it('should keep the signature, quote and embedded image classes when the content is rewritten', () => {
        createEditor(`<div>Text</div>${SIGNATURE}${QUOTE}<div>${IMAGE}</div>`);
        editor.formatContentModel(() => true);

        expect(getClassNames()).toEqual(EXPECTED_CLASS_NAMES);
        expect(element.querySelector('.protonmail_signature_block > .protonmail_signature_block-user')).not.toBeNull();
    });

    it('should keep them through formatting the whole content', () => {
        createEditor(`<div>Text</div>${SIGNATURE}${QUOTE}<div>${IMAGE}</div>`);
        const range = document.createRange();
        range.selectNodeContents(element);
        editor.select(range);

        toggleBold(editor);

        expect(element.querySelector('b, [style*="font-weight"]')).not.toBeNull();
        expect(getClassNames()).toEqual(EXPECTED_CLASS_NAMES);
    });
});
