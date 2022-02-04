import { RefObject } from 'react';
import { DefaultFormat, EditorPlugin, IEditor, Direction } from 'roosterjs-editor-types';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { DEFAULT_FONT_FACE, DEFAULT_FONT_SIZE, ROOSTER_SNAPSHOTS_MAX_SIZE } from '../../constants';
import { EditorActions, OnEditorEventListened } from '../../interface';

import EditorEventListener from '../plugins/EditorEventListener';
import UndoSnapshots from '../plugins/UndoSnapshots';
import getRoosterEditorActions from './getRoosterEditorActions';
import EditorCustomPastePlugin from '../plugins/EditorCustomPastePlugin';
import { ModalLinkProps } from '../../hooks/interface';

interface Options {
    onEditorEvent: OnEditorEventListened;
    initialContent?: string;
    showModalLink: (props: ModalLinkProps) => void;
    iframeRef: RefObject<HTMLIFrameElement>;
    mailSettings?: MailSettings;
    onPasteImage: (image: File) => void;
    openEmojiPicker: () => void;
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
        new EditorCustomPastePlugin(options.onPasteImage),
    ];

    const fontSize = options.mailSettings?.FontSize ? `${options.mailSettings.FontSize}px` : `${DEFAULT_FONT_SIZE}px`;

    const defaultFormat: DefaultFormat = {
        bold: false,
        fontFamily: options.mailSettings?.FontFace || DEFAULT_FONT_FACE,
        fontSize,
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
        options.iframeRef,
        () => {
            undoSnapshotService.clearSnapshots();
        },
        (direction: Direction) => {
            setDirection(editor, direction);
        },
        () => {
            options.showModalLink?.({ editor, createLink });
        },
        options.openEmojiPicker
    );

    return { editor, actions };
};
