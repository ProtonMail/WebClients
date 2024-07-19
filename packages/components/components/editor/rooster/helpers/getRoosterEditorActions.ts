import type { RefObject } from 'react';

import type { IEditor } from 'roosterjs-editor-types';
import { ChangeSource, SelectionRangeTypes } from 'roosterjs-editor-types';

import type { DIRECTION } from '@proton/shared/lib/mail/mailSettings';

import type { EditorActions } from '../../interface';

/**
 * @param editorInstance
 * @returns set of external actions
 */
const getRoosterEditorActions = (
    editorInstance: IEditor,
    iframeRef: RefObject<HTMLIFrameElement>,
    clearUndoHistory: () => void,
    setTextDirection: (direction: DIRECTION) => void,
    showModalLink: () => void,
    openEmojiPicker: () => void
): EditorActions => {
    return {
        getContent: (...args) => {
            return editorInstance.getContent(...args);
        },
        isDisposed() {
            return editorInstance.isDisposed();
        },
        setContent(value: string) {
            editorInstance.addUndoSnapshot(() => {
                editorInstance.setContent(value);
            });
        },
        focus() {
            if (editorInstance.isDisposed()) {
                return;
            }

            // Helps passing tests (JSDOM issue)
            try {
                iframeRef.current?.focus();
                editorInstance.focus();
            } catch (e) {
                console.error(e);
            }
        },
        insertImage(url: string, attrs: { [key: string]: string } = {}) {
            const imageNode = document.createElement('img');

            Object.entries(attrs).forEach(([key, value]) => {
                imageNode.setAttribute(key, value);
            });

            imageNode.src = url;
            imageNode.classList.add('proton-embedded');
            editorInstance.insertNode(imageNode);
            editorInstance.triggerContentChangedEvent();
        },
        clearUndoHistory,
        setTextDirection,
        showModalLink,
        openEmojiPicker,
        getSelectionContent() {
            const selectionRangeEx = editorInstance.getSelectionRangeEx();
            if (selectionRangeEx.type !== SelectionRangeTypes.Normal) {
                return;
            }

            let content = '';

            selectionRangeEx.ranges.forEach((range) => {
                const selectionTraverser = editorInstance.getSelectionTraverser(range);
                if (!selectionTraverser) {
                    return;
                }

                let inlineElement = selectionTraverser.currentInlineElement;
                let currentBlock = selectionTraverser.currentBlockElement;

                while (inlineElement) {
                    const inlineElementBlock = inlineElement.getParentBlock();
                    const isNewLine = inlineElementBlock !== currentBlock && !!inlineElementBlock.getTextContent();
                    if (isNewLine) {
                        currentBlock = inlineElement.getParentBlock();
                        content += '\n';
                    }
                    // TODO: needed to remove this for the assistant feature, need to rework it later
                    // else {
                    // content += ' ';
                    // }
                    content += inlineElement.getTextContent();
                    inlineElement = selectionTraverser.getNextInlineElement();
                }
            });

            return content;
        },
        setSelectionContent(content) {
            editorInstance.addUndoSnapshot(() => {
                editorInstance.insertContent(content.replace(/\n/g, '<br>'));
            }, ChangeSource.SetContent);
        },
    };
};

export default getRoosterEditorActions;
