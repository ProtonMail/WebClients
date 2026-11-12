import { Editor } from 'roosterjs';
import type { IEditor } from 'roosterjs-editor-types';

import { DIRECTION } from '@proton/shared/lib/mail/mailSettings';

import getRoosterEditorActions from './getRoosterEditorActions';

const INITIAL_CONTENT = '<div>One <b>bold</b> word</div><div>Second line</div>';

describe('getRoosterEditorActions', () => {
    let element: HTMLDivElement;
    let editor: IEditor;
    let iframe: HTMLIFrameElement;
    const clearUndoHistory = jest.fn();
    const setTextDirection = jest.fn();
    const showModalLink = jest.fn();
    const openEmojiPicker = jest.fn();

    const getActions = () =>
        getRoosterEditorActions(
            editor,
            { current: iframe },
            clearUndoHistory,
            setTextDirection,
            showModalLink,
            openEmojiPicker
        );

    const firstLineText = () => element.firstChild!.firstChild!;
    const secondLineText = () => element.lastChild!.firstChild!;

    const select = (startNode: Node, startOffset: number, endNode: Node, endOffset: number) => {
        const range = document.createRange();
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        editor.select(range);
    };

    beforeEach(() => {
        jest.clearAllMocks();
        element = document.createElement('div');
        // JSDOM can only focus a contenteditable element with a tabindex, and Rooster inserts only when it has the focus
        element.tabIndex = 0;
        iframe = document.createElement('iframe');
        document.body.append(element, iframe);
        editor = new Editor(element, { initialContent: INITIAL_CONTENT });
        editor.focus();
    });

    afterEach(() => {
        if (!editor.isDisposed()) {
            editor.dispose();
        }
        element.remove();
        iframe.remove();
    });

    it('returns the editor content', () => {
        expect(getActions().getContent()).toBe(INITIAL_CONTENT);
    });

    it('replaces the content, as one step that undo takes back', () => {
        const actions = getActions();

        actions.setContent('<div>Replaced</div>');
        expect(actions.getContent()).toBe('<div>Replaced</div>');

        editor.undo();
        expect(actions.getContent()).toBe(INITIAL_CONTENT);
    });

    it('inserts an embedded image where the cursor is, with its attributes', () => {
        select(firstLineText(), 3, firstLineText(), 3);

        getActions().insertImage!('blob:https://mail.proton.me/image', {
            'data-embedded-img': 'cid:image',
            alt: 'Logo',
        });

        const image = element.firstElementChild?.querySelector('img');
        expect(image?.getAttribute('src')).toBe('blob:https://mail.proton.me/image');
        expect(image?.getAttribute('data-embedded-img')).toBe('cid:image');
        expect(image?.getAttribute('alt')).toBe('Logo');
        expect(image?.classList.contains('proton-embedded')).toBe(true);
        expect(element.firstChild?.textContent).toBe('One bold word');
    });

    it('reads nothing when the selection is collapsed', () => {
        select(firstLineText(), 3, firstLineText(), 3);

        expect(getActions().getSelectionContent()).toBe('');
    });

    // INWEB-1526: it starts a new line before every inline element, so formatting splits a line: "\nOne \nbold\n word\nSecond"
    it.failing('reads the selected text, with a line break between blocks only', () => {
        select(firstLineText(), 0, secondLineText(), 6);

        expect(getActions().getSelectionContent()).toBe('One bold word\nSecond');
    });

    it('replaces the selection with text, turning line breaks into `<br>`, as one step that undo takes back', () => {
        const actions = getActions();
        select(secondLineText(), 0, secondLineText(), 6);

        actions.setSelectionContent('Line one\nLine two');
        expect(element.textContent).toBe('One bold wordLine oneLine two line');
        expect(element.querySelectorAll('br')).toHaveLength(1);

        editor.undo();
        expect(actions.getContent()).toBe(INITIAL_CONTENT);
    });

    it('passes the other actions through', () => {
        const actions = getActions();

        actions.clearUndoHistory!();
        actions.setTextDirection!(DIRECTION.RIGHT_TO_LEFT);
        actions.showModalLink!();
        actions.openEmojiPicker!();

        expect(clearUndoHistory).toHaveBeenCalled();
        expect(setTextDirection).toHaveBeenCalledWith(DIRECTION.RIGHT_TO_LEFT);
        expect(showModalLink).toHaveBeenCalled();
        expect(openEmojiPicker).toHaveBeenCalled();
    });

    it('does not focus a disposed editor', () => {
        const actions = getActions();
        const focusIframe = jest.spyOn(iframe, 'focus');

        editor.dispose();
        actions.focus();

        expect(actions.isDisposed()).toBe(true);
        expect(focusIframe).not.toHaveBeenCalled();
    });
});
