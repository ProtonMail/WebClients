import { safeCall } from '@proton/pass/utils/fp/safe-call';

export const POPOVER_SUPPORTED = 'popover' in HTMLElement.prototype;

export const showPopover = safeCall((target: HTMLElement) => target.showPopover());
export const hidePopover = safeCall((target: HTMLElement) => target.hidePopover());

/** Finds the closest ancestor element that creates a modal context and captures focus */
export const getClosestModal = (target: HTMLElement) => target.closest<HTMLElement>(':modal');

/** Returns the topmost modal element that's currently active in the document */
export const getActiveModal = () => {
    const modals = document.querySelectorAll<HTMLElement>(':modal');
    return modals.length > 0 ? modals[modals.length - 1] : null;
};
