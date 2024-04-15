import type { Maybe } from '@proton/pass/types';
import { isFormElement } from '@proton/pass/utils/dom/predicates';

export const parseFormAction = (form: HTMLElement): Maybe<string> => {
    const isForm = isFormElement(form);

    if (isForm) {
        const action = form.action as string | HTMLInputElement;
        return typeof action === 'string' ? action : action.value;
    }
};

const BUSY_ATTRIBUTES = ['disabled', 'aria-disabled', 'aria-busy', 'readonly'];

/** Heuristic check to determine if a form element or field is in a
 * busy state by inspecting certain attributes. */
export const isElementBusy = (el: HTMLElement): boolean =>
    BUSY_ATTRIBUTES.some((attr) => el.hasAttribute(attr) && el.getAttribute(attr) !== 'false');

/** Walks up the DOM tree to check if an element is contained within
 * a busy DOM element.*/
export const isParentBusy = (el: HTMLElement): boolean => {
    const parent = el.parentElement;
    if (!parent) return false;
    return isElementBusy(parent) || isParentBusy(parent);
};
