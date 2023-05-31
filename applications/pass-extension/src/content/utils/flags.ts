import { fathom } from '@proton/pass/fathom';

import { PROCESSED_ATTR } from '../constants';

export const setElementProcessed = (el: HTMLElement): void => el.setAttribute(PROCESSED_ATTR, '1');
export const setElementProcessable = (el: HTMLElement): void => el.removeAttribute(PROCESSED_ATTR);
export const elementProcessed = (el: HTMLElement): boolean => el.getAttribute(PROCESSED_ATTR) === '1';
export const elementTrackable = (el: HTMLInputElement) => !el.disabled && fathom.utils.isVisible(el);
export const elementProcessable = (el: HTMLInputElement): boolean => !elementProcessed(el) && elementTrackable(el);
