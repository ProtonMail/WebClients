import type { Dispatch, SetStateAction } from 'react';

import type { IEditor, InsertOption, PluginEvent } from 'roosterjs-editor-types';

import type { DIRECTION } from '@proton/shared/lib/mail/mailSettings';

export interface EditorMetadata {
    supportFiles: boolean;
    supportPlainText: boolean;
    supportDefaultFontSelector: boolean;
    isPlainText: boolean;
    supportRightToLeft: boolean;
    rightToLeft: DIRECTION;
    blockquoteExpanded: boolean;
    setBlockquoteExpanded: Dispatch<SetStateAction<boolean>> | undefined;
}

/**
 * External editor actions returned to parent component
 */
export interface EditorActions {
    focus: () => void;
    setContent: (content: string, triggerAutoSave?: boolean) => void;
    insertContent: (content: string, options?: InsertOption) => void;
    getContent: IEditor['getContent'];
    getSelectionContent: () => string | undefined;
    setSelectionContent: (selection: string) => void;
    insertImage?: (url: string, attrs?: { [key: string]: string }) => void;
    clearUndoHistory?: () => void;
    /** Meant to be used at startup */
    setTextDirection?: (direction: DIRECTION) => void;
    /** Tells if Editor is unmounted */
    isDisposed: () => boolean;
    showModalLink?: () => void;
    openEmojiPicker?: () => void;
    scroll?: (scrollToOption: ScrollToOptions) => void;
}

export type OnEditorEventListened = (editorEvent: PluginEvent, editor: IEditor) => void;

export type SetEditorToolbarConfig = (editorInstance: IEditor | undefined) => void;
