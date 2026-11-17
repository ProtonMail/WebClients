import type { ContentModelSegmentFormat } from 'roosterjs-content-model-types';
import type { EditorPlugin as LegacyEditorPlugin } from 'roosterjs-editor-types';

import { DEFAULT_FONT_FACE, DEFAULT_FONT_SIZE, getFontFaceValueFromId } from '@proton/shared/lib/mail/fontFace';
import type { DIRECTION } from '@proton/shared/lib/mail/mailSettings';

import EditorCustomPastePlugin from '../plugins/EditorCustomPastePlugin';
import EditorEventListener from '../plugins/EditorEventListener';
import { clearUndoSnapshots, createUndoSnapshots } from '../plugins/UndoSnapshotsV9';
import getRoosterEditorActions from './getRoosterEditorActions';
import type { InitRoosterOptions, InitRoosterReturns } from './initRoosterEditor';
import { getProtonClassNamesDomToModelOption, protonClassNamesModelToDomOption } from './protonClassNames';
import { loadRoosterV9FormatApi } from './roosterFormatApi';

export const initRoosterEditorV9 = async (
    element: HTMLDivElement,
    options: InitRoosterOptions
): Promise<InitRoosterReturns> => {
    const [
        { EditorAdapter },
        { AutoFormatPlugin, EditPlugin, HyperlinkPlugin, ImageEditPlugin, PastePlugin, ShortcutPlugin },
        { formatContainerProcessor },
        { createLink, setDirection },
    ] = await Promise.all([
        import(/* webpackChunkName: "roosterjs-v9" */ 'roosterjs-editor-adapter'),
        import(/* webpackChunkName: "roosterjs-v9" */ 'roosterjs-content-model-plugins'),
        import(/* webpackChunkName: "roosterjs-v9" */ 'roosterjs-content-model-dom'),
        loadRoosterV9FormatApi(),
    ]);

    const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--primary');
    const legacyPlugins: LegacyEditorPlugin[] = [
        new EditorEventListener(options.onEditorEvent),
        new EditorCustomPastePlugin(options.onPasteFiles, options.isPastedImageAllowed),
    ];

    const fontSize = options.mailSettings?.FontSize ? `${options.mailSettings.FontSize}px` : `${DEFAULT_FONT_SIZE}px`;
    const fontFamily = (() => {
        if (options.mailSettings?.FontFace) {
            return getFontFaceValueFromId(options.mailSettings.FontFace) || DEFAULT_FONT_FACE;
        }
        return DEFAULT_FONT_FACE;
    })();

    const defaultSegmentFormat: ContentModelSegmentFormat = {
        fontWeight: 'normal',
        fontFamily,
        fontSize,
    };

    if (element === null) {
        throw new Error('Ref should be provided to instanciate the editor');
    }

    const snapshots = createUndoSnapshots();

    const editor = new EditorAdapter(element, {
        plugins: [
            new EditPlugin(),
            new AutoFormatPlugin({ autoBullet: true, autoNumbering: true, autoLink: true }),
            new ShortcutPlugin(),
            new PastePlugin(),
            new HyperlinkPlugin(),
            new ImageEditPlugin({
                disableRotate: true,
                disableCrop: true,
                preserveRatio: true,
                borderColor,
                minWidth: 20,
                minHeight: 20,
                disableSideResize: true,
            }),
        ],
        legacyPlugins,
        defaultSegmentFormat,
        defaultDomToModelOptions: getProtonClassNamesDomToModelOption(formatContainerProcessor),
        defaultModelToDomOptions: protonClassNamesModelToDomOption,
        initialContent: options.initialContent,
        snapshots,
    });

    const actions = getRoosterEditorActions(
        editor,
        options.iframeRef,
        () => {
            clearUndoSnapshots(snapshots);
            editor.takeSnapshot();
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
