import type { Callback } from '@proton/pass/types';

export type HTMLElementWithActionTrap = HTMLInputElement & { preventAction?: boolean };

export const preventActions = (el: HTMLElementWithActionTrap) => (el.preventAction = true);
export const shouldPreventActions = (el: HTMLElementWithActionTrap) => el.preventAction === true;
export const allowActions = (el: HTMLElementWithActionTrap) => delete el.preventAction;

export const withActionTrap =
    <F extends Callback>(el: HTMLElementWithActionTrap, fn: F) =>
    (...args: Parameters<F>): ReturnType<F> => {
        preventActions(el);
        const result = fn(...args);
        allowActions(el);
        return result;
    };
