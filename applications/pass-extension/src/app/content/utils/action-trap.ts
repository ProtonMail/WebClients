import type { Callback } from '@proton/pass/types';

export type HTMLElementWithActionTrap = HTMLElement & { preventAction?: boolean };

/** Flags an element to block certain autofill/autosave actions triggered
 * on focus in/out events. This is necessary as we cannot directly attach
 * data to these DOM events, so we rely on Element flags. */
export const actionTrap = (el: HTMLElementWithActionTrap, duration: number = 250) => {
    el.preventAction = true;
    setTimeout(() => (el.preventAction = false), duration);
};

/** Checks whether an element has an action prevented flag. */
export const actionPrevented = (el: HTMLElementWithActionTrap) => el.preventAction === true;

/** Wraps a callback function with an action trapping mechanism. */
export const withActionTrap =
    <F extends Callback>(el: HTMLElementWithActionTrap, fn: F, duration: number = 250) =>
    (...args: Parameters<F>): ReturnType<F> => {
        actionTrap(el, duration);
        return fn(...args);
    };
