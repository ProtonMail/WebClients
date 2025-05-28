import { CompatibleChangeSource } from 'roosterjs';
import type { Alignment, FormatState, IEditor } from 'roosterjs-editor-types';

import { getRoosterDirection } from '@proton/components/components/editor/rooster/helpers/initRoosterEditor';
import type { Optional } from '@proton/shared/lib/interfaces';
import type { DIRECTION } from '@proton/shared/lib/mail/mailSettings';

import { DEFAULT_BACKGROUND, DEFAULT_FONT_COLOR } from '../constants';
import type { ModalDefaultFontProps, ModalImageProps, ModalLinkProps } from '../hooks/interface';
import type { EditorMetadata } from '../interface';
import type { Emoji } from '../toolbar/ToolbarEmojiDropdown';
import rgbToHex from './rgbToHex';

interface ItemToggle {
    isActive: boolean;
    toggle: () => void;
}

interface ItemValue<T = string> {
    value: T;
    setValue: (nextValue: T) => void;
}

interface ItemModal {
    showModal: () => void;
}

export interface ToolbarConfig {
    bold: ItemToggle;
    italic: ItemToggle;
    underline: ItemToggle;
    strikethrough: ItemToggle;
    fontFace: Optional<ItemValue, 'value'>;
    fontSize: Optional<ItemValue, 'value'>;
    fontColor: ItemValue;
    defaultFont: ItemModal;
    backgroundColor: ItemValue;
    unorderedList: ItemToggle;
    orderedList: ItemToggle;
    alignment: Pick<ItemValue<Alignment>, 'setValue'>;
    blockquote: ItemToggle;
    link: ItemModal;
    image: ItemModal;
    formatting: {
        clear: () => void;
    };
    textDirection: Pick<ItemValue<DIRECTION>, 'setValue'>;
    emoji: {
        insert: (emoji: Emoji) => void;
    };
}

interface Options {
    showModalLink: (options: ModalLinkProps) => void;
    showModalImage: (options: ModalImageProps) => void;
    showModalDefaultFont: (options: ModalDefaultFontProps) => void;
    onChangeMetadata: ((metadataChange: Partial<EditorMetadata>) => void) | undefined;
    onAddAttachments: ((files: File[]) => void) | undefined;
}

const cleanRoosterFont = (font: string | undefined) => font?.replaceAll('"', '');

export const getToolbarConfig = async (editorInstance: IEditor | undefined, options: Options) => {
    const {
        clearFormat,
        createLink,
        getFormatState,
        insertImage,
        removeLink,
        setAlignment,
        setBackgroundColor,
        setDirection,
        setFontName,
        setFontSize,
        setTextColor,
        toggleBlockQuote,
        toggleBold,
        toggleBullet,
        toggleItalic,
        toggleNumbering,
        toggleUnderline,
        toggleStrikethrough,
    } = await import(/* webpackChunkName: "roosterjs", webpackPrefetch: true */ 'roosterjs');
    if (!editorInstance || editorInstance.isDisposed()) {
        return;
    }

    let formatState: FormatState;
    try {
        formatState = getFormatState(editorInstance);
    } catch {
        // in tests, it can happen that the (JSDom) window is closed as the format state is being read
        return;
    }

    const config: ToolbarConfig = {
        bold: {
            isActive: !!formatState.isBold,
            toggle: () => {
                toggleBold(editorInstance);
            },
        },
        italic: {
            isActive: !!formatState.isItalic,
            toggle: () => {
                toggleItalic(editorInstance);
            },
        },
        underline: {
            isActive: !!formatState.isUnderline,
            toggle: () => {
                toggleUnderline(editorInstance);
            },
        },
        strikethrough: {
            isActive: !!formatState.isStrikeThrough,
            toggle: () => {
                toggleStrikethrough(editorInstance);
            },
        },
        fontFace: {
            value: cleanRoosterFont(formatState.fontName),
            setValue: (nextFontFace) => {
                setFontName(editorInstance, nextFontFace);
            },
        },
        fontSize: {
            value: formatState.fontSize,
            setValue: (nextFontSize) => {
                setFontSize(editorInstance, nextFontSize);
            },
        },
        defaultFont: {
            showModal: () => {
                options.showModalDefaultFont({
                    onChange: (nextFontFace, nextFontSize) => {
                        setFontSize(editorInstance, `${nextFontSize}px`);
                        setFontName(editorInstance, nextFontFace);
                    },
                });
            },
        },
        fontColor: {
            value: rgbToHex(formatState.textColor) || DEFAULT_FONT_COLOR,
            setValue: (nextColor) => {
                setTextColor(editorInstance, nextColor);
            },
        },
        backgroundColor: {
            value: rgbToHex(formatState.backgroundColor) || DEFAULT_BACKGROUND,
            setValue: (nextColor) => {
                setBackgroundColor(editorInstance, nextColor);
            },
        },
        unorderedList: {
            isActive: !!formatState.isBullet,
            toggle: () => {
                toggleBullet(editorInstance);
            },
        },
        orderedList: {
            isActive: !!formatState.isNumbering,
            toggle: () => {
                toggleNumbering(editorInstance);
            },
        },
        alignment: {
            setValue: (nextAlignement) => {
                setAlignment(editorInstance, nextAlignement);
            },
        },
        blockquote: {
            isActive: !!formatState.isBlockQuote,
            toggle: () => {
                toggleBlockQuote(editorInstance);
            },
        },
        link: {
            showModal: () => {
                options.showModalLink({ editor: editorInstance, createLink });
            },
        },
        image: {
            showModal: () => {
                options.showModalImage({
                    onAddImages: (images) => {
                        if (options.onAddAttachments) {
                            options.onAddAttachments(images);
                        } else {
                            images.forEach((image) => {
                                insertImage(editorInstance, image);
                            });
                        }
                    },
                    onAddUrl: (url) => {
                        const imageNode = document.createElement('img');
                        imageNode.src = url;
                        imageNode.classList.add('proton-embedded');
                        editorInstance.insertNode(imageNode);
                    },
                });
            },
        },
        formatting: {
            clear: () => {
                clearFormat(editorInstance);
                removeLink(editorInstance);
            },
        },
        textDirection: {
            setValue: (nextDirection) => {
                setDirection(editorInstance, getRoosterDirection(nextDirection));
                options.onChangeMetadata?.({ rightToLeft: nextDirection });
            },
        },
        emoji: {
            insert: (emoji) => {
                editorInstance.addUndoSnapshot(() => {
                    editorInstance.insertContent(emoji.native);
                }, CompatibleChangeSource.SetContent);
            },
        },
    };

    return config;
};
