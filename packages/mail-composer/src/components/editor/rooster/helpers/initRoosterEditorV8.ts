import type { DefaultFormat, EditorPlugin } from 'roosterjs-editor-types';

import { isMac } from '@proton/shared/lib/helpers/browser';
import { DEFAULT_FONT_FACE, DEFAULT_FONT_SIZE, getFontFaceValueFromId } from '@proton/shared/lib/mail/fontFace';
import type { DIRECTION } from '@proton/shared/lib/mail/mailSettings';

import { DEFAULT_BACKGROUND, DEFAULT_FONT_COLOR, ROOSTER_SNAPSHOTS_MAX_SIZE } from '../../constants';
import EditorCustomPastePlugin from '../plugins/EditorCustomPastePlugin';
import EditorEventListener from '../plugins/EditorEventListener';
import UndoSnapshots from '../plugins/UndoSnapshots';
import getRoosterEditorActions from './getRoosterEditorActions';
import type { InitRoosterOptions, InitRoosterReturns } from './initRoosterEditor';
import { loadRoosterV8FormatApi } from './roosterFormatApi';

export const initRoosterEditorV8 = async (
    element: HTMLDivElement,
    options: InitRoosterOptions
): Promise<InitRoosterReturns> => {
    const [
        {
            ContentEdit,
            Paste,
            HyperLink,
            Editor,
            CutPasteListChain,
            ExperimentalFeatures,
            createSnapshots,
            addSnapshot,
            canMoveCurrentSnapshot,
            canUndoAutoComplete,
            clearProceedingSnapshots,
            moveCurrentSnapshot,
            createLink,
            ImageEdit,
        },
        { setDirection },
    ] = await Promise.all([
        import(/* webpackChunkName: "roosterjs", webpackPrefetch: true */ 'roosterjs'),
        loadRoosterV8FormatApi(),
    ]);

    const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--primary');
    const plugins: EditorPlugin[] = [
        new ContentEdit({
            indentWhenAltShiftRight: !isMac(),
            outdentWhenAltShiftLeft: !isMac(),
        }),
        new Paste(),
        new CutPasteListChain(),
        new HyperLink(),
        new EditorEventListener(options.onEditorEvent),
        new EditorCustomPastePlugin(options.onPasteFiles, options.isPastedImageAllowed),
        new ImageEdit({
            disableRotate: true,
            preserveRatio: true,
            borderColor,
            minWidth: 20,
            minHeight: 20,
            disableSideResize: true,
        }),
    ];

    const fontSize = options.mailSettings?.FontSize ? `${options.mailSettings.FontSize}px` : `${DEFAULT_FONT_SIZE}px`;
    const fontFamily = (() => {
        if (options.mailSettings?.FontFace) {
            return getFontFaceValueFromId(options.mailSettings.FontFace) || DEFAULT_FONT_FACE;
        }
        return DEFAULT_FONT_FACE;
    })();

    const defaultFormat: DefaultFormat = {
        bold: false,
        fontFamily,
        fontSize,
        textColor: DEFAULT_FONT_COLOR,
        backgroundColor: DEFAULT_BACKGROUND,
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
        experimentalFeatures: [ExperimentalFeatures.AutoFormatList],
    });

    const actions = getRoosterEditorActions(
        editor,
        options.iframeRef,
        () => {
            undoSnapshotService.clearSnapshots();
        },
        (direction: DIRECTION) => {
            setDirection(editor, direction);
        },
        () => {
            options.showModalLink?.({ editor, createLink });
        },
        options.openEmojiPicker
    );

    return { editor, actions };
};
