import type { EditorAdapter } from 'roosterjs-editor-adapter';
import type { FormatState, IEditor } from 'roosterjs-editor-types';

import { DIRECTION } from '@proton/shared/lib/mail/mailSettings';

import type { ModalLinkProps } from '../../hooks/interface';

export type Alignment = 'left' | 'center' | 'right';

type ToolbarFormatState = Pick<
    FormatState,
    | 'isBold'
    | 'isItalic'
    | 'isUnderline'
    | 'isStrikeThrough'
    | 'fontName'
    | 'fontSize'
    | 'textColor'
    | 'backgroundColor'
    | 'isBullet'
    | 'isNumbering'
    | 'isBlockQuote'
>;

type Format = (editor: IEditor) => void;
type FormatWith<T> = (editor: IEditor, value: T) => void;

/**
 * The formatting the toolbar applies, for both roosterjs 8 and roosterjs 9 through its editor adapter
 */
export interface RoosterFormatApi {
    getFormatState: (editor: IEditor) => ToolbarFormatState;
    toggleBold: Format;
    toggleItalic: Format;
    toggleUnderline: Format;
    toggleStrikethrough: Format;
    toggleBullet: Format;
    toggleNumbering: Format;
    toggleBlockQuote: Format;
    clearFormat: Format;
    removeLink: Format;
    setFontName: FormatWith<string>;
    setFontSize: FormatWith<string>;
    setTextColor: FormatWith<string>;
    setBackgroundColor: FormatWith<string>;
    setAlignment: FormatWith<Alignment>;
    setDirection: FormatWith<DIRECTION>;
    insertImage: FormatWith<File>;
    createLink: ModalLinkProps['createLink'];
}

/**
 * roosterjs 9 is used through EditorAdapter, which also implements the roosterjs 8 editor interface
 */
const isEditorAdapter = (editor: IEditor): editor is EditorAdapter => 'formatContentModel' in editor;

export const loadRoosterV8FormatApi = async (): Promise<RoosterFormatApi> => {
    const rooster = await import(/* webpackChunkName: "roosterjs", webpackPrefetch: true */ 'roosterjs');
    const alignments = {
        left: rooster.Alignment.Left,
        center: rooster.Alignment.Center,
        right: rooster.Alignment.Right,
    };

    return {
        getFormatState: rooster.getFormatState,
        toggleBold: rooster.toggleBold,
        toggleItalic: rooster.toggleItalic,
        toggleUnderline: rooster.toggleUnderline,
        toggleStrikethrough: rooster.toggleStrikethrough,
        toggleBullet: rooster.toggleBullet,
        toggleNumbering: rooster.toggleNumbering,
        toggleBlockQuote: rooster.toggleBlockQuote,
        clearFormat: rooster.clearFormat,
        removeLink: rooster.removeLink,
        setFontName: rooster.setFontName,
        setFontSize: rooster.setFontSize,
        setTextColor: rooster.setTextColor,
        setBackgroundColor: rooster.setBackgroundColor,
        setAlignment: (editor, alignment) => rooster.setAlignment(editor, alignments[alignment]),
        setDirection: (editor, direction) =>
            rooster.setDirection(
                editor,
                direction === DIRECTION.RIGHT_TO_LEFT ? rooster.Direction.RightToLeft : rooster.Direction.LeftToRight
            ),
        insertImage: rooster.insertImage,
        createLink: rooster.createLink,
    };
};

/**
 * roosterjs 9 only formats the selection, while roosterjs 8 selects the start of the content when nothing is selected.
 * The composer sets the default direction right after setting the content, before anything is selected.
 */
const selectStartWhenNothingSelected = (editor: EditorAdapter) => {
    const [firstBlock] = editor.getDOMHelper().queryElements(':scope > *');
    if (editor.getDOMSelection() || !firstBlock) {
        return;
    }
    const range = editor.getDocument().createRange();
    range.setStart(firstBlock, 0);
    editor.setDOMSelection({ type: 'range', range, isReverted: false });
};

export const loadRoosterV9FormatApi = async (): Promise<RoosterFormatApi> => {
    const [rooster, { unquoteSelectedBlocks }] = await Promise.all([
        import(/* webpackChunkName: "roosterjs-v9" */ 'roosterjs-content-model-api'),
        import(/* webpackChunkName: "roosterjs-v9" */ './unquoteSelectedBlocks'),
    ]);
    const format =
        (apply: (editor: EditorAdapter) => void): Format =>
        (editor) =>
            apply(editor as EditorAdapter);
    const formatWith =
        <T>(apply: (editor: EditorAdapter, value: T) => void): FormatWith<T> =>
        (editor, value) =>
            apply(editor as EditorAdapter, value);

    return {
        getFormatState: (editor) => rooster.getFormatState(editor as EditorAdapter),
        toggleBold: format(rooster.toggleBold),
        toggleItalic: format(rooster.toggleItalic),
        toggleUnderline: format(rooster.toggleUnderline),
        toggleStrikethrough: format(rooster.toggleStrikethrough),
        toggleBullet: format(rooster.toggleBullet),
        toggleNumbering: format(rooster.toggleNumbering),
        toggleBlockQuote: format((editor) => {
            if (!unquoteSelectedBlocks(editor)) {
                rooster.toggleBlockQuote(editor);
            }
        }),
        clearFormat: format(rooster.clearFormat),
        removeLink: format(rooster.removeLink),
        setFontName: formatWith(rooster.setFontName),
        setFontSize: formatWith(rooster.setFontSize),
        setTextColor: formatWith(rooster.setTextColor),
        setBackgroundColor: formatWith(rooster.setBackgroundColor),
        setAlignment: formatWith(rooster.setAlignment),
        setDirection: formatWith((editor, direction: DIRECTION) => {
            selectStartWhenNothingSelected(editor);
            rooster.setDirection(editor, direction === DIRECTION.RIGHT_TO_LEFT ? 'rtl' : 'ltr');
        }),
        insertImage: formatWith(rooster.insertImage),
        createLink: (editor, link, altText, displayText) =>
            rooster.insertLink(editor as EditorAdapter, link, altText, displayText),
    };
};

export const loadRoosterFormatApi = (editor: IEditor) =>
    isEditorAdapter(editor) ? loadRoosterV9FormatApi() : loadRoosterV8FormatApi();
