/* eslint-disable class-methods-use-this */
import { BeforePasteEvent, EditorPlugin, IEditor, PluginEvent, PluginEventType } from 'roosterjs-editor-types';
import { wrap } from 'roosterjs-editor-dom';

import { linkify } from '../helpers/linkify';
import { EMBEDDABLE_TYPES } from '../../constants';

/**
 * Handles custom behavior when pasting content on top of the current rooster paste plugin
 */
class EditorCustomPastePlugin implements EditorPlugin {
    private editor: IEditor | undefined;

    private onPasteImage: ((image: File) => void) | undefined;

    constructor(onPasteImage: (image: File) => void) {
        this.editor = undefined;
        this.onPasteImage = onPasteImage;
    }

    getName() {
        return 'EditorCustomPastePlugin';
    }

    initialize(editor: IEditor) {
        this.editor = editor;
    }

    dispose() {}

    onPluginEvent(event: PluginEvent) {
        if (!this.editor || event.eventType !== PluginEventType.BeforePaste) {
            return;
        }

        this.updateSanitizingOptions(event);
        this.linkifyPlainTextContent(event);
        this.handlePasteImage(event);
    }

    private updateSanitizingOptions(event: BeforePasteEvent) {
        event.sanitizingOption.additionalAllowedAttributes = ['bgcolor'];
        event.sanitizingOption.additionalTagReplacements = {
            // @ts-expect-error
            INPUT: null,
            // @ts-expect-error
            TEXTAREA: null,
            // @ts-expect-error
            FORM: null,
        };
    }

    private handlePasteImage(event: BeforePasteEvent) {
        const { image, types } = event.clipboardData;

        // Image should have 1 type only in order to be sure it's only an image
        if (image && types.length === 1) {
            // we replace pasted content by empty string
            event.fragment.textContent = '';
            // Check if image type is supported
            const isSupportedFileType = EMBEDDABLE_TYPES.includes(image.type);
            if (isSupportedFileType && this.onPasteImage) {
                this.onPasteImage(event.clipboardData.image);
            }
        }
    }

    private linkifyPlainTextContent(event: BeforePasteEvent) {
        const isPlainTextContent =
            event.clipboardData.text &&
            event.clipboardData.types.length === 1 &&
            event.clipboardData.types[0] === 'text/plain';

        if (!isPlainTextContent) {
            return;
        }

        const text = event.clipboardData.text;

        // Clear textContent
        event.fragment.textContent = '';

        const NBSP_HTML = '\u00A0';
        const fragment = event.fragment;

        // Paste text
        text.split('\n').forEach((line, index, lines) => {
            line = line
                .replace(/^ /g, NBSP_HTML)
                .replace(/\r/g, '')
                .replace(/ {2}/g, ' ' + NBSP_HTML);
            const span = document.createElement('span');
            span.innerHTML = linkify(line);

            // There are 3 scenarios:
            // 1. Single line: Paste as it is
            // 2. Two lines: Add <br> between the lines
            // 3. 3 or More lines, For first and last line, paste as it is. For middle lines, wrap with DIV, and add BR if it is empty line
            if (lines.length == 2 && index == 0) {
                // 1 of 2 lines scenario, add BR
                fragment.appendChild(span);
                fragment.appendChild(document.createElement('br'));
            } else if (index > 0 && index < lines.length - 1) {
                // Middle line of >=3 lines scenario, wrap with DIV
                fragment.appendChild(wrap(line == '' ? document.createElement('br') : span));
            } else {
                // All others, paste as it is
                fragment.appendChild(span);
            }
        });
    }
}

export default EditorCustomPastePlugin;
