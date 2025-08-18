import { isDialogOpen, isDropdownOpen, isEditing, isModalOpen } from '../busy';
import { isMac } from '../helpers/browser';
import type { KeyboardKeyType } from '../interfaces';

const HTML_TAGS_TO_IGNORE = ['input', 'select', 'textarea', 'button', 'a'];

export const isBusy = (e: KeyboardEvent) => {
    const { tagName, isContentEditable } = e.target as HTMLElement;

    return (
        HTML_TAGS_TO_IGNORE.includes(tagName.toLowerCase()) ||
        isContentEditable ||
        isDialogOpen() ||
        isModalOpen() ||
        isDropdownOpen() ||
        isEditing()
    );
};

export const isValidShortcut = (shortcut: KeyboardKeyType[], event: KeyboardEvent): boolean => {
    const shortcutKeys = shortcut.map((key) => key.toLowerCase());
    const eventKey = event.key.toLowerCase();
    const eventMetaKeyPressed = isMac() ? event.metaKey : event.ctrlKey;
    const eventShiftKeyPressed = event.shiftKey;

    const shouldNotPressMetaKey = !shortcutKeys.includes('meta') && eventMetaKeyPressed;
    const shouldNotPressShiftKey = !shortcutKeys.includes('shift') && eventShiftKeyPressed;

    if (shouldNotPressMetaKey || shouldNotPressShiftKey) {
        return false;
    }

    const isOk = shortcut.map(() => false);
    shortcutKeys.forEach((shortcutKey, index) => {
        if (
            (shortcutKey === 'shift' && eventShiftKeyPressed) ||
            (shortcutKey === 'meta' && eventMetaKeyPressed) ||
            shortcutKey === eventKey
        ) {
            isOk[index] = true;
            return;
        }

        isOk[index] = false;
    });

    if (isOk.every((item) => item === true)) {
        return true;
    }

    return false;
};
