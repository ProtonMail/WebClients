/* eslint-disable class-methods-use-this */
import { BeforePasteEvent, EditorPlugin, IEditor, PluginEvent, PluginEventType } from 'roosterjs-editor-types';
import { wrap } from 'roosterjs-editor-dom';
import { linkify } from '../helpers/linkify';

/**
 * Handles custom behavior when pasting content on top of the current rooster paste plugin
 */
class EditorCustomPastePlugin implements EditorPlugin {
    private editor: IEditor | undefined;

    constructor() {
        this.editor = undefined;
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

        event.sanitizingOption.additionalTagReplacements = {
            // @ts-expect-error
            INPUT: null,
            // @ts-expect-error
            TEXTAREA: null,
            // @ts-expect-error
            FORM: null,
        };

        const isPlainTextContent =
            event.clipboardData.types.length === 1 && event.clipboardData.types[0] === 'text/plain';
        if (isPlainTextContent) {
            this.linkifyPlainTextContent(event);
        }
    }

    private linkifyPlainTextContent(event: BeforePasteEvent) {
        const text = event.clipboardData.text;
        if (!text) {
            return;
        }

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
