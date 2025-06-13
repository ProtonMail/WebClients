import { useRef } from 'react';

import type { HotkeyTuple } from '@proton/components';
import { useHotkeys } from '@proton/components';
import { MESSAGE_ACTIONS } from '@proton/mail-renderer/constants';
import { KeyboardKey } from '@proton/shared/lib/interfaces';
import { isBusy } from '@proton/shared/lib/shortcuts/helpers';

import useMailModel from 'proton-mail/hooks/useMailModel';

import { useOnCompose } from '../../containers/ComposeProvider';
import { ComposeTypes } from '../composer/useCompose';

export interface PageHotkeysHandlers {
    onOpenShortcutsModal: () => void;
}

export const usePageHotkeys = ({ onOpenShortcutsModal }: PageHotkeysHandlers) => {
    const { Shortcuts } = useMailModel('MailSettings');
    const onCompose = useOnCompose();

    const documentRef = useRef(window.document);

    const shortcutHandlers: HotkeyTuple[] = [
        [
            KeyboardKey.QuestionMark,
            (e) => {
                if (!isBusy(e)) {
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
                if (Shortcuts && !isBusy(e)) {
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
                if (Shortcuts && !isBusy(e)) {
                    e.preventDefault();
                    void onCompose({ type: ComposeTypes.newMessage, action: MESSAGE_ACTIONS.NEW });
                }
            },
        ],
    ];

    useHotkeys(documentRef, shortcutHandlers);
};
