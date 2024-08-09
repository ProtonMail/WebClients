import type { MutableRefObject, RefObject } from 'react';
import { useRef } from 'react';

import type { EditorActions, HotkeyTuple } from '@proton/components';
import { useHotkeys } from '@proton/components';
import { isSafari as checkIsSafari } from '@proton/shared/lib/helpers/browser';
import { editorShortcuts } from '@proton/shared/lib/shortcuts/mail';
import noop from '@proton/utils/noop';

import type { ExternalEditorActions } from '../../components/composer/editor/EditorWrapper';
import { EditorTypes } from './useComposerContent';

interface ComposerHotkeysHandlers {
    type: EditorTypes.composer;
    handleClose: () => Promise<void>;
    toggleMinimized: () => void;
    handlePassword: () => void;
    handleExpiration: () => void;
    editorRef: MutableRefObject<ExternalEditorActions | undefined>;
    minimizeButtonRef: RefObject<HTMLButtonElement>;
    isAssistantExpanded: boolean;
    closeAssistant: () => void;
    collapseAssistant: () => void;
}

interface QuickReplyHotkeysHandlers {
    type: EditorTypes.quickReply;
    editorRef: MutableRefObject<EditorActions | undefined>;
}

export type EditorHotkeysHandlers = (ComposerHotkeysHandlers | QuickReplyHotkeysHandlers) & {
    composerRef: RefObject<HTMLDivElement>;
    handleSend: () => Promise<void>;
    handleDelete: () => Promise<void>;
    handleManualSave: () => Promise<void>;
    toggleMaximized: () => void;
    lock: boolean;
    saving: boolean;
    hasHotkeysEnabled: boolean;
};

export const useComposerHotkeys = (args: EditorHotkeysHandlers) => {
    const {
        composerRef,
        handleSend,
        handleDelete,
        toggleMaximized,
        handleManualSave,
        lock,
        saving,
        hasHotkeysEnabled,
        type,
    } = args;
    const isSafari = checkIsSafari();

    const isComposer = type === EditorTypes.composer;
    const isAssistantExpanded = isComposer && !!args.isAssistantExpanded;

    const attachmentTriggerRef = useRef<() => void>(noop);

    const keyHandlers = {
        close: async (e: KeyboardEvent) => {
            if (isComposer) {
                e.preventDefault();
                e.stopPropagation();
                if (args.isAssistantExpanded) {
                    // When composer assistant is expanded, we want to close it when using "Esc"
                    args.collapseAssistant();
                } else {
                    // We still need to close the assistant in that case to clean the context,
                    // because we allow one assistant opened at the same time
                    args.closeAssistant();
                    await args.handleClose();
                }
            }
        },
        send: async (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (!lock && !isAssistantExpanded) {
                await handleSend();
            }
        },
        delete: async (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            await handleDelete();
        },
        save: async (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (!saving && !lock) {
                await handleManualSave();
            }
        },
        minimize: (e: KeyboardEvent) => {
            if (isComposer) {
                e.preventDefault();
                e.stopPropagation();
                args.toggleMinimized();
                // Focus minimize button on minimize with shortcut, otherwise focus would still be on Composer, and it's still possible to edit fields
                args.minimizeButtonRef.current?.focus();
            }
        },
        maximize: (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMaximized();
        },
        addAttachment: (e: KeyboardEvent) => {
            if (attachmentTriggerRef.current && !isAssistantExpanded) {
                e.preventDefault();
                e.stopPropagation();
                attachmentTriggerRef.current();
            }
        },
        encrypt: (e: KeyboardEvent) => {
            if (isComposer && !isAssistantExpanded) {
                e.preventDefault();
                e.stopPropagation();
                args.handlePassword();
            }
        },
        addExpiration: (e: KeyboardEvent) => {
            if (isComposer && !isAssistantExpanded) {
                e.preventDefault();
                e.stopPropagation();
                args.handleExpiration();
            }
        },
        linkModal: (e: KeyboardEvent) => {
            if (isComposer && args.editorRef?.current && !isAssistantExpanded) {
                e.preventDefault();
                e.stopPropagation();
                args.editorRef.current?.showLinkModal?.();
            }
        },
        emojiPicker: (e: KeyboardEvent) => {
            if (args.editorRef?.current && !isAssistantExpanded) {
                e.preventDefault();
                e.stopPropagation();
                args.editorRef.current?.openEmojiPicker?.();
            }
        },
    };

    const hotKeysActions: HotkeyTuple[] = hasHotkeysEnabled
        ? [
              [editorShortcuts.close, keyHandlers.close],
              [editorShortcuts.send, keyHandlers.send],
              [editorShortcuts.deleteDraft, keyHandlers.delete],
              [editorShortcuts.save, keyHandlers.save],
              [
                  editorShortcuts.minimize,
                  (e) => {
                      if (!isSafari) {
                          keyHandlers.minimize(e);
                      }
                  },
              ],
              [
                  editorShortcuts.maximize,
                  (e) => {
                      if (!isSafari) {
                          keyHandlers.maximize(e);
                      }
                  },
              ],
              [editorShortcuts.addAttachment, keyHandlers.addAttachment],
              [editorShortcuts.addEncryption, keyHandlers.encrypt],
              [editorShortcuts.addExpiration, keyHandlers.addExpiration],
              [editorShortcuts.addLink, keyHandlers.linkModal],
              [editorShortcuts.emojiPicker, keyHandlers.emojiPicker],
          ]
        : [];

    useHotkeys(composerRef, hotKeysActions);

    return attachmentTriggerRef;
};
