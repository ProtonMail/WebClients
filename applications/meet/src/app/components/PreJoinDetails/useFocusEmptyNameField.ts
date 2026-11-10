import type { RefObject } from 'react';
import { useEffect } from 'react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectCameraPermission,
    selectMicrophonePermission,
    selectPermissionsModals,
} from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import { PermissionsModalType } from '@proton/meet/store/slices/deviceManagementSlice/types';

const INTERACTIVE_ELEMENT_SELECTOR = [
    'a',
    'button',
    'input',
    'select',
    'textarea',
    'label',
    'summary',
    '[role="button"]',
    '[role="menuitem"]',
    '[role="option"]',
    '[contenteditable="true"]',
    '[tabindex]:not([tabindex^="-"])',
].join(', ');

export const focusKeepingSelection = (input: HTMLInputElement) => {
    const { selectionStart, selectionEnd, selectionDirection } = input;
    input.focus();
    if (selectionStart !== null && selectionEnd !== null) {
        input.setSelectionRange(selectionStart, selectionEnd, selectionDirection ?? undefined);
    }
};

const isNothingFocused = (countMainAsNothing: boolean) => {
    const { activeElement } = document;
    return (
        !activeElement ||
        activeElement === document.body ||
        activeElement === document.documentElement ||
        (countMainAsNothing && activeElement.tagName === 'MAIN')
    );
};

const isInsideInteractiveElement = (target: EventTarget | null) =>
    target instanceof Element && target.closest(INTERACTIVE_ELEMENT_SELECTOR) !== null;

export const useFocusEmptyNameField = (nameInputRef: RefObject<HTMLInputElement>, isFocusOnNameExpected: boolean) => {
    const { permissionsModal } = useMeetSelector(selectPermissionsModals);
    const cameraPermission = useMeetSelector(selectCameraPermission);
    const microphonePermission = useMeetSelector(selectMicrophonePermission);
    const isPermissionsModalOpen = permissionsModal !== PermissionsModalType.NONE;

    useEffect(() => {
        if (!isFocusOnNameExpected || isPermissionsModalOpen) {
            return;
        }

        const pendingTimeouts = new Set<ReturnType<typeof setTimeout>>();

        const focusNameIfIdle = (countMainAsNothing: boolean) => {
            if (nameInputRef.current && isNothingFocused(countMainAsNothing)) {
                focusKeepingSelection(nameInputRef.current);
            }
        };

        const focusNameIfIdleAfterFocusSettles = () => {
            const timeout = setTimeout(() => {
                pendingTimeouts.delete(timeout);
                focusNameIfIdle(false);
            }, 0);
            pendingTimeouts.add(timeout);
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                focusNameIfIdleAfterFocusSettles();
            }
        };

        const handleDocumentClick = (event: MouseEvent) => {
            if (!isInsideInteractiveElement(event.target)) {
                focusNameIfIdle(true);
            }
        };

        focusNameIfIdleAfterFocusSettles();
        window.addEventListener('focus', focusNameIfIdleAfterFocusSettles);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('click', handleDocumentClick);

        return () => {
            pendingTimeouts.forEach(clearTimeout);
            window.removeEventListener('focus', focusNameIfIdleAfterFocusSettles);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('click', handleDocumentClick);
        };
    }, [nameInputRef, isFocusOnNameExpected, isPermissionsModalOpen, cameraPermission, microphonePermission]);
};
