export type HTMLElementWithActionTrap = HTMLElement & { preventAction?: boolean };

/** Flags an element to block certain autofill/autosave actions triggered on focus
 * in/out events. This is necessary as we cannot directly attach data to these DOM
 * events, so we rely on Element flags. Returns a function to release the trap. */
export const actionTrap = (el: HTMLElementWithActionTrap, duration: number = 250) => {
    el.preventAction = true;
    const timer = setTimeout(() => (el.preventAction = false), duration);

    return () => {
        el.preventAction = false;
        clearTimeout(timer);
    };
};

/** Checks whether an element has an action prevented flag. */
export const actionPrevented = (el: HTMLElementWithActionTrap) => el.preventAction === true;
