import { RefObject } from 'react';

import { IEditor } from 'roosterjs-editor-types';

import { DIRECTION } from '@proton/shared/lib/mail/mailSettings';

import { EditorActions } from '../../interface';

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
        getContent() {
            return editorInstance.getContent();
        },
        isDisposed() {
            return editorInstance.isDisposed();
        },
        setContent(value: string) {
            editorInstance.setContent(value);
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
    };
};

export default getRoosterEditorActions;
