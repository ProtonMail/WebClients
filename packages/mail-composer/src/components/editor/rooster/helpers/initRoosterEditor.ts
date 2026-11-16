import type { RefObject } from 'react';

import type { IEditor } from 'roosterjs-editor-types';

import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';

import type { ModalLinkProps } from '../../hooks/interface';
import type { EditorActions, OnEditorEventListened } from '../../interface';
import { initRoosterEditorV8 } from './initRoosterEditorV8';
import { initRoosterEditorV9 } from './initRoosterEditorV9';

export interface InitRoosterOptions {
    onEditorEvent: OnEditorEventListened;
    initialContent?: string;
    showModalLink: (props: ModalLinkProps) => void;
    iframeRef: RefObject<HTMLIFrameElement | null>;
    mailSettings?: MailSettings;
    onPasteFiles: (files: File[]) => void;
    isPastedImageAllowed?: (image: HTMLImageElement) => boolean;
    openEmojiPicker: () => void;
}

export interface InitRoosterReturns {
    editor: IEditor;
    actions: EditorActions;
}

/**
 * roosterjs 9 runs through its roosterjs 8 compatible editor adapter, behind the MailComposerRoosterV9 flag
 */
export const initRoosterEditor = (
    element: HTMLDivElement,
    options: InitRoosterOptions & { isRoosterV9: boolean }
): Promise<InitRoosterReturns> =>
    options.isRoosterV9 ? initRoosterEditorV9(element, options) : initRoosterEditorV8(element, options);
