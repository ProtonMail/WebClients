import { isMac } from 'proton-shared/lib/helpers/browser';
import { noop } from 'proton-shared/lib/helpers/function';
import { useRef } from 'react';
import { useHandler, useHotkeys, useMailSettings } from 'react-components';

export interface ComposerHotkeysHandlers {
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
}

export const useComposerHotkeys = ({
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
}: ComposerHotkeysHandlers) => {
    const [mailSettings] = useMailSettings();

    const composerRef = useRef<HTMLDivElement>(null);
    const attachmentTriggerRef = useRef<() => void>(noop);

    const { Shortcuts = 0 } = mailSettings || {};

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
            if (!saving) {
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
    };

    const ctrlOrMetaKey = (e: KeyboardEvent) => (isMac() ? e.metaKey : e.ctrlKey);

    const squireKeydownHandler = useHandler(async (e: KeyboardEvent) => {
        switch (e.key.toLowerCase()) {
            case 'escape':
                if (Shortcuts) {
                    await keyHandlers?.close(e);
                }
                break;
            case 'enter':
                if (Shortcuts && ctrlOrMetaKey(e)) {
                    await keyHandlers?.send(e);
                }
                break;
            case 'backspace':
                if (Shortcuts && ctrlOrMetaKey(e) && e.altKey) {
                    await keyHandlers?.delete(e);
                }
                break;
            case 's':
                if (Shortcuts && ctrlOrMetaKey(e)) {
                    await keyHandlers?.save(e);
                }
                break;
            case 'm':
                if (Shortcuts && ctrlOrMetaKey(e)) {
                    if (e.shiftKey) {
                        keyHandlers?.maximize(e);
                        return;
                    }
                    keyHandlers?.minimize(e);
                }
                break;
            case 'a':
                if (Shortcuts && ctrlOrMetaKey(e) && e.shiftKey) {
                    keyHandlers?.addAttachment(e);
                }
                break;
            case 'e':
                if (Shortcuts && ctrlOrMetaKey(e) && e.shiftKey) {
                    keyHandlers?.encrypt(e);
                }
                break;
            case 'x':
                if (Shortcuts && ctrlOrMetaKey(e) && e.shiftKey) {
                    keyHandlers?.addExpiration(e);
                }
                break;
            default:
                break;
        }
    });

    useHotkeys(composerRef, [
        [['Escape'], keyHandlers.close],
        [['Meta', 'Enter'], keyHandlers.send],
        [['Meta', 'Alt', 'Backspace'], keyHandlers.delete],
        [['Meta', 'S'], keyHandlers.save],
        [['Meta', 'M'], keyHandlers.minimize],
        [['Meta', 'Shift', 'M'], keyHandlers.maximize],
        [['Meta', 'Shift', 'A'], keyHandlers.addAttachment],
        [['Meta', 'Shift', 'E'], keyHandlers.encrypt],
        [['Meta', 'Shift', 'X'], keyHandlers.addExpiration],
    ]);

    return { composerRef, squireKeydownHandler, attachmentTriggerRef };
};
