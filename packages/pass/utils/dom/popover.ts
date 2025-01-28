import { safeCall } from '@proton/pass/utils/fp/safe-call';
import noop from '@proton/utils/noop';

export const POPOVER_SUPPORTED = 'popover' in HTMLElement.prototype;
export const showPopover = POPOVER_SUPPORTED ? safeCall((target: HTMLElement) => target.showPopover()) : noop;
export const hidePopover = POPOVER_SUPPORTED ? safeCall((target: HTMLElement) => target.hidePopover()) : noop;
export const isPopoverChild = (target: HTMLElement) => target.matches('dialog[open] *, :popover-open *');
export const getPopoverModal = () => document.querySelector<HTMLElement>(':modal');
