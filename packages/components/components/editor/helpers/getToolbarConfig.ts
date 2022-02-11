import { Alignment, Direction, IEditor } from 'roosterjs-editor-types';
import { Optional } from '@proton/shared/lib/interfaces';
import { DEFAULT_BACKGROUND, DEFAULT_FONT_COLOR } from '../constants';
import { ModalDefaultFontProps } from '../hooks/useModalDefaultFont';
import { ModalImageProps } from '../hooks/useModalImage';
import { ModalLinkProps } from '../hooks/useModalLink';
import { EditorMetadata } from '../interface';
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
    textDirection: Pick<ItemValue<Direction>, 'setValue'>;
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
    } = await import(/* webpackPreload: true */ 'roosterjs');

    if (!editorInstance) {
        return;
    }

    const formatState = getFormatState(editorInstance);

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
                const selectedText = editorInstance.getSelectionRange().toString();
                const cursorEl = editorInstance.getElementAtCursor('a[href]') as HTMLAnchorElement | null;

                const title = cursorEl?.innerText || selectedText;
                const href = cursorEl?.href;

                options.showModalLink({
                    linkLabel: title,
                    linkUrl: href,
                    onSubmit: (nextLinkTitle, nextLinkUrl) => {
                        createLink(editorInstance, nextLinkUrl, undefined, nextLinkTitle);
                    },
                });
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
                setDirection(editorInstance, nextDirection);
                options.onChangeMetadata?.({ rightToLeft: nextDirection });
            },
        },
    };

    return config;
};
