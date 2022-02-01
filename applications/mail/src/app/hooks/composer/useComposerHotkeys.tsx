import { MutableRefObject, RefObject, useRef } from 'react';
import { HotkeyTuple, useHotkeys } from '@proton/components';
import { isSafari as checkIsSafari } from '@proton/shared/lib/helpers/browser';
import { noop } from '@proton/shared/lib/helpers/function';
import { ExternalEditorActions } from '../../components/composer/editor/EditorWrapper';

export interface ComposerHotkeysHandlers {
    composerRef: RefObject<HTMLDivElement>;
    handleClose: () => Promise<void>;
    handleSend: () => Promise<void>;
    handleDelete: () => Promise<void>;
    handleManualSave: () => Promise<void>;
    toggleMinimized: () => void;
    toggleMaximized: () => void;
    handlePassword: () => void;
    handleExpiration: () => void;
    lock: boolean;
    saving: boolean;
    editorActionsRef: MutableRefObject<ExternalEditorActions | undefined>;
}

export const useComposerHotkeys = ({
    composerRef,
    handleClose,
    handleSend,
    handleDelete,
    handleManualSave,
    toggleMaximized,
    toggleMinimized,
    handlePassword,
    handleExpiration,
    lock,
    saving,
    editorActionsRef,
}: ComposerHotkeysHandlers) => {
    const isSafari = checkIsSafari();

    const attachmentTriggerRef = useRef<() => void>(noop);

    const keyHandlers = {
        close: async (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            await handleClose();
        },
        send: async (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (!lock) {
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
            e.preventDefault();
            e.stopPropagation();
            toggleMinimized();
        },
        maximize: (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMaximized();
        },
        addAttachment: (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            attachmentTriggerRef.current?.();
        },
        encrypt: (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            handlePassword();
        },
        addExpiration: (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            handleExpiration();
        },
        linkModal: (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            editorActionsRef.current?.showLinkModal();
        },
    };

    const hotKeysActions: HotkeyTuple[] = [
        [['Escape'], keyHandlers.close],
        [['Meta', 'Enter'], keyHandlers.send],
        [['Meta', 'Alt', 'Backspace'], keyHandlers.delete],
        [['Meta', 'S'], keyHandlers.save],
        [
            ['Meta', 'M'],
            (e) => {
                if (!isSafari) {
                    keyHandlers.minimize(e);
                }
            },
        ],
        [
            ['Meta', 'Shift', 'M'],
            (e) => {
                if (!isSafari) {
                    keyHandlers.maximize(e);
                }
            },
        ],
        [['Meta', 'Shift', 'A'], keyHandlers.addAttachment],
        [['Meta', 'Shift', 'E'], keyHandlers.encrypt],
        [['Meta', 'Shift', 'X'], keyHandlers.addExpiration],
        [['Meta', 'K'], keyHandlers.linkModal],
    ];

    useHotkeys(composerRef, hotKeysActions);

    return { composerRef, attachmentTriggerRef, hotKeysActions };
};
