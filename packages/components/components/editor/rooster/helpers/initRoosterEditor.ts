import { DefaultFormat, EditorPlugin, IEditor, Direction } from 'roosterjs-editor-types';
import { DEFAULT_FONT_FACE, DEFAULT_FONT_SIZE, ROOSTER_SNAPSHOTS_MAX_SIZE } from '../../constants';
import { EditorActions, OnEditorEventListened } from '../../interface';

import EditorEventListener from '../plugins/EditorEventListener';
import UndoSnapshots from '../plugins/UndoSnapshots';
import getRoosterEditorActions from './getRoosterEditorActions';
import { ModalLinkProps } from '../../hooks/useModalLink';

interface Options {
    onEditorEvent: OnEditorEventListened;
    initialContent?: string;
    showModalLink: (props: ModalLinkProps) => void;
}

interface InitRoosterReturns {
    editor: IEditor;
    actions: EditorActions;
}

export const initRoosterEditor = async (element: HTMLDivElement, options: Options): Promise<InitRoosterReturns> => {
    const {
        ContentEdit,
        Paste,
        HyperLink,
        Editor,
        createSnapshots,
        addSnapshot,
        canMoveCurrentSnapshot,
        canUndoAutoComplete,
        clearProceedingSnapshots,
        moveCurrentSnapshot,
        setDirection,
        createLink,
    } = await import(/* webpackPreload: true */ 'roosterjs');

    const plugins: EditorPlugin[] = [
        new ContentEdit(),
        new Paste(),
        new HyperLink(),
        new EditorEventListener(options.onEditorEvent),
    ];

    const defaultFormat: DefaultFormat = {
        bold: false,
        fontFamily: DEFAULT_FONT_FACE,
        fontSize: `${DEFAULT_FONT_SIZE}px`,
    };

    if (element === null) {
        throw new Error('Ref should be provided to instanciate the editor');
    }

    // Create custom undoSnapshotService in order to be able to clear snapshots
    const undoSnapshotService = new UndoSnapshots(createSnapshots(ROOSTER_SNAPSHOTS_MAX_SIZE), {
        addSnapshot,
        canMoveCurrentSnapshot,
        canUndoAutoComplete,
        clearProceedingSnapshots,
        createSnapshots,
        moveCurrentSnapshot,
    });

    const editor = new Editor(element, {
        plugins,
        defaultFormat,
        initialContent: options.initialContent,
        undoSnapshotService,
    });

    const actions = getRoosterEditorActions(
        editor,
        () => {
            undoSnapshotService.clearSnapshots();
        },
        (direction: Direction) => {
            setDirection(editor, direction);
        },
        () => {
            const selectedText = editor.getSelectionRange().toString();
            const cursorEl = editor.getElementAtCursor('a[href]') as HTMLElement | null;

            const title = selectedText || cursorEl?.innerText || undefined;
            const href = selectedText ? undefined : cursorEl?.getAttribute('href') || undefined;

            options.showModalLink?.({
                linkLabel: title,
                linkUrl: href,
                onSubmit: (nextLinkTitle, nextLinkUrl) => {
                    createLink(editor, nextLinkUrl, undefined, nextLinkTitle);
                },
            });
        }
    );

    return { editor, actions };
};
