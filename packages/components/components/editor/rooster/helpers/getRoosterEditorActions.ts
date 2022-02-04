import { RefObject } from 'react';
import { IEditor, Direction } from 'roosterjs-editor-types';
import { EditorActions } from '../../interface';

/**
 * @param editorInstance
 * @returns set of external actions
 */
const getRoosterEditorActions = (
    editorInstance: IEditor,
    iframeRef: RefObject<HTMLIFrameElement>,
    clearUndoHistory: () => void,
    setTextDirection: (direction: Direction) => void,
    showModalLink: () => void
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
            iframeRef.current?.contentWindow?.focus();
            editorInstance.focus();
        },
        insertImage(url: string, attrs: { [key: string]: string } = {}) {
            const imageNode = document.createElement('img');

            Object.entries(attrs).forEach(([key, value]) => {
                imageNode.setAttribute(key, value);
            });

            imageNode.src = url;
            imageNode.classList.add('proton-embedded');
            editorInstance.insertNode(imageNode);
        },
        clearUndoHistory,
        setTextDirection,
        showModalLink,
    };
};

export default getRoosterEditorActions;
