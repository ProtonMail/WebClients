import { isFocusable as tabbableIsFocusable, tabbable as tabbableTabbable } from 'tabbable';

export type { FocusableElement } from 'tabbable';

/*
 * This file wraps the tabbable library with a goal to handle any exceptions
 */

export const isFocusable = (...args: Parameters<typeof tabbableIsFocusable>) => {
    try {
        return tabbableIsFocusable(...args);
    } catch {
        return false;
    }
};

export const tabbable = (...args: Parameters<typeof tabbableTabbable>) => {
    try {
        return tabbableTabbable(...args);
    } catch {
        return [];
    }
};
