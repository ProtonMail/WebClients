import { Direction, IEditor, PluginEvent } from 'roosterjs-editor-types';
import { Dispatch, SetStateAction } from 'react';

export { Direction as EditorTextDirection } from 'roosterjs-editor-types';

export interface EditorMetadata {
    supportImages: boolean;
    supportPlainText: boolean;
    supportDefaultFontSelector: boolean;
    isPlainText: boolean;
    supportRightToLeft: boolean;
    rightToLeft: Direction;
    blockquoteExpanded: boolean;
    setBlockquoteExpanded: Dispatch<SetStateAction<boolean>> | undefined;
}

/**
 * External editor actions returned to parent component
 */
export interface EditorActions {
    focus: () => void;
    setContent: (content: string, triggerAutoSave?: boolean) => void;
    getContent: () => string;
    insertImage?: (url: string, attrs?: { [key: string]: string }) => void;
    clearUndoHistory?: () => void;
    /** Meant to be used at startup */
    setTextDirection?: (direction: Direction) => void;
    /** Tells if Editor is unmounted */
    isDisposed: () => boolean;
    showModalLink?: () => void;
    openEmojiPicker?: () => void;
}

export type OnEditorEventListened = (editorEvent: PluginEvent, editor: IEditor) => void;

export type SetEditorToolbarConfig = (editorInstance: IEditor | undefined) => void;
