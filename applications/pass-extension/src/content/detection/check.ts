import { utils } from '@proton/pass/fathom';
import { isHTMLElement } from '@proton/pass/utils/dom';
import { invert } from '@proton/pass/utils/fp/predicates';

import { PROCESSED_INPUT_ATTR } from '../constants';
import { FormHandles } from '../types';

const { isVisible } = utils;

const isFormChild = (forms: FormHandles[]) => (el: Node) =>
    isHTMLElement(el) && forms.some((form) => form.element === el || form.element.contains(el));

/**
 * Run the detection only if the current's frame
 * document body is visible and we have new untracked
 * input elements in the DOM. An input is considered
 * "untracked" if it is not contained in a currently
 * tracked form & is not flagged by the {PROCESSED_INPUT_ATTR}
 * attribute
 */
const shouldRunDetection = (forms: FormHandles[]) => {
    if (!isVisible(document.body)) {
        return false;
    }

    const untracked = Array.from(
        document.querySelectorAll<HTMLInputElement>(`input:not([${PROCESSED_INPUT_ATTR}="1"])`)
    ).filter(isVisible);

    untracked.forEach((el) => el.setAttribute(PROCESSED_INPUT_ATTR, '1'));
    return untracked.filter(invert(isFormChild(forms))).length > 0;
};

export const getMutationResults = (forms: FormHandles[]) => {
    const runDetection = shouldRunDetection(forms);
    const removeForms = forms.filter((form) => form.shouldRemove());
    const updateForms = forms.filter((form) => !removeForms.includes(form) && form.shouldUpdate());

    return {
        runDetection,
        removeForms,
        updateForms,
    };
};
