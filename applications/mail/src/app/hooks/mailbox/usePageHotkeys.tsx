import { useRef } from 'react';

import { HotkeyTuple, useHotkeys, useMailSettings } from '@proton/components';
import { KeyboardKey } from '@proton/shared/lib/interfaces';
import { isTargetEditable } from '@proton/shared/lib/shortcuts/helpers';

import { MESSAGE_ACTIONS } from '../../constants';
import { useOnCompose } from '../../containers/ComposeProvider';
import { useFolderNavigationHotkeys } from './useFolderNavigationHotkeys';

export interface PageHotkeysHandlers {
    onOpenShortcutsModal: () => void;
}

export const usePageHotkeys = ({ onOpenShortcutsModal }: PageHotkeysHandlers) => {
    const [{ Shortcuts = 0 } = {}] = useMailSettings();
    const folderNavigationHotkeys = useFolderNavigationHotkeys();
    const onCompose = useOnCompose();

    const documentRef = useRef(window.document);

    const shortcutHandlers: HotkeyTuple[] = [
        ...folderNavigationHotkeys,
        [
            KeyboardKey.QuestionMark,
            (e) => {
                if (!isTargetEditable(e)) {
                    onOpenShortcutsModal();
                }
            },
        ],
        [
            'Tab',
            () => {
                const focusedElement = document.querySelector(':focus');
                if (focusedElement) {
                    return;
                }
                const element =
                    (document.querySelector(
                        '[data-shortcut-target="item-container"][data-shortcut-target-selected="true"]'
                    ) as HTMLElement) ||
                    (document.querySelector('[data-shortcut-target="item-container"]') as HTMLElement);
                element?.focus();
            },
        ],
        [
            KeyboardKey.Slash,
            (e) => {
                if (Shortcuts && !isTargetEditable(e)) {
                    e.preventDefault();
                    const button = document.querySelector('[data-shorcut-target="searchbox-button"]') as HTMLElement;
                    button?.dispatchEvent(
                        new MouseEvent('click', {
                            view: window,
                            bubbles: true,
                            cancelable: false,
                        })
                    );
                }
            },
        ],
        [
            'N',
            (e) => {
                if (Shortcuts && !isTargetEditable(e)) {
                    onCompose({ action: MESSAGE_ACTIONS.NEW });
                }
            },
        ],
    ];

    useHotkeys(documentRef, shortcutHandlers);
};
