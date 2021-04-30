import { useRef } from 'react';
import { KeyboardKey } from 'proton-shared/lib/interfaces';
import { isTargetEditable } from 'proton-shared/lib/shortcuts/helpers';
import { HotkeyTuple, useHotkeys, useMailSettings } from 'react-components';
import { MESSAGE_ACTIONS } from '../../constants';
import { OnCompose } from '../composer/useCompose';
import { useFolderNavigationHotkeys } from './useFolderNavigationHotkeys';

export interface PageHotkeysHandlers {
    onCompose: OnCompose;
    onOpenShortcutsModal: () => void;
}

export const usePageHotkeys = ({ onCompose, onOpenShortcutsModal }: PageHotkeysHandlers) => {
    const [{ Shortcuts = 0 } = {}] = useMailSettings();
    const folderNavigationHotkeys = useFolderNavigationHotkeys();

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
                    const searchbox = document.querySelector('[data-shorcut-target="searchbox-field"]') as HTMLElement;
                    searchbox?.focus();
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
