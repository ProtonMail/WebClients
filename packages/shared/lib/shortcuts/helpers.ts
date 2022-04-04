import { isMac } from '../helpers/browser';
import { KeyboardKeyType } from '../interfaces';

const HTML_TAGS_TO_IGNORE = ['input', 'select', 'textarea'];

export const isTargetEditable = (e: KeyboardEvent) => {
    const { tagName, isContentEditable } = e.target as HTMLElement;

    return HTML_TAGS_TO_IGNORE.includes(tagName.toLowerCase()) || isContentEditable;
};

export const isValidShortcut = (shortcut: KeyboardKeyType[], event: KeyboardEvent): boolean => {
    let isOk = shortcut.map(() => false);
    shortcut.forEach((key, index) => {
        const formattedKey = key.toLowerCase();
        let ok = false;

        if (formattedKey === 'meta') {
            ok = isMac() ? event.metaKey : event.ctrlKey;
        }
        if (formattedKey === 'shift') {
            ok = event.shiftKey;
        }

        if (formattedKey === event.key.toLowerCase()) {
            ok = true;
        }

        if (ok) {
            isOk[index] = true;
        }
    });

    if (isOk.every((item) => item === true)) {
        return true;
    }

    return false;
};
