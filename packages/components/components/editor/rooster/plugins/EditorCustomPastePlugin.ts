/* eslint-disable class-methods-use-this */
import { getPasteSource, wrap } from 'roosterjs-editor-dom';
import {
    AttributeCallbackMap,
    BeforePasteEvent,
    EditorPlugin,
    IEditor,
    KnownPasteSourceType,
    PluginEvent,
    PluginEventType,
} from 'roosterjs-editor-types';

import { transformLinkify } from '@proton/shared/lib/mail/transformLinkify';

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

    private validateLink(link: string, htmlElement: HTMLElement) {
        const PROTOCOLS = ['http:', 'https:', 'mailto:'];
        let url;
        try {
            url = new URL(link);
        } catch {
            url = undefined;
        }

        if (url && PROTOCOLS.includes(url.protocol)) {
            return link;
        }
        htmlElement.removeAttribute('href');
        return '';
    }

    private updateSanitizingOptions(event: BeforePasteEvent) {
        const callbackMap: AttributeCallbackMap = {
            href: (link: string, element: HTMLElement) => this.validateLink(link, element),
        };
        event.sanitizingOption.attributeCallbacks = callbackMap;
        event.sanitizingOption.additionalAllowedAttributes = ['bgcolor'];
        event.sanitizingOption.additionalTagReplacements = {
            INPUT: null,
            TEXTAREA: null,
            FORM: null,
        };
    }

    private handlePasteImage(event: BeforePasteEvent) {
        const {
            clipboardData: { image, rawHtml },
        } = event;

        /**
         * When pasting content from Word or OneNote, there are multiple clipboardDate.types and an image inside the event.
         * So be careful if you want to base yourself on those ones
         *
         * Be careful to check those 3 points:
         * - Image should exist
         * - RawHTML should be null or contain a single image
         * - Image type should contain an allowed type
         */
        if (
            image &&
            (rawHtml === null || getPasteSource(event, true) === KnownPasteSourceType.SingleImage) &&
            EMBEDDABLE_TYPES.includes(image.type)
        ) {
            // we replace pasted content by empty string
            event.fragment.textContent = '';
            const pasteImage = this.onPasteImage;
            if (pasteImage) {
                this.editor?.focus();
                // Need to wait to focus before pasting
                setTimeout(() => {
                    pasteImage(image);
                }, 0);
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

        // Clear textContent in order to force rooster paste fragment
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
            span.innerHTML = transformLinkify({ content: line });

            /**
             * There are three possible scenarios:
             * 1. Single line: Paste as is
             * 2. Two lines: Add <br> between the lines
             * 3. Three or more lines:
             *   - For first and last line, paste as is.
             *   - For middle lines, wrap with DIV, and add <br> if it's an empty line.
             */
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
