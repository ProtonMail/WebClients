import { fieldOfInterestSelector, formOfInterestSelector, isUserEditableField } from '@proton/pass/fathom';
import type { FormField, FormType } from '@proton/pass/types';

import { PROCESSED_FIELD_ATTR, PROCESSED_FORM_ATTR } from '../constants';

/* As a heuristic we can safely ignore forms of type `[role="search"]` as we are most
 * likely not interested in tracking those. Since we apply a clustering algorithm in
 * the detectors, we may have non-form elements  detected as forms - we can retrieve
 * these by querying for the `PROCESSED_FORM_ATTR` attribute which is added to the element
 * upon successful detection */
export const selectAllForms = () => {
    const selector = `${formOfInterestSelector}, [${PROCESSED_FORM_ATTR}]`;
    const candidates = document.querySelectorAll<HTMLElement>(selector);
    return Array.from(candidates);
};

/* Unprocessed are forms that have never been seen by our detectors:
 * if that is the case they will lack a `data-protonpass-form` attr */
export const selectUnprocessedForms = () => {
    const selector = `${formOfInterestSelector}:not([${PROCESSED_FORM_ATTR}])`;
    return Array.from(document.querySelectorAll<HTMLElement>(selector));
};

export const hasUnprocessedForms = () => selectUnprocessedForms().length > 0;

/* dangling fields are fields that match our `fieldOfInterestSelector`
 * but have either not been processed or do not belong to a currently
 * tracked form */
export const selectDanglingFields = () => {
    const selector = `:not([${PROCESSED_FIELD_ATTR}]):not([${PROCESSED_FORM_ATTR}] input)`;
    const candidates = document.querySelectorAll<HTMLInputElement>(fieldOfInterestSelector);
    return Array.from(candidates).filter((el) => el.matches(selector));
};

export const setFormProcessed = (el: HTMLElement, formType: FormType): void =>
    el.setAttribute(PROCESSED_FORM_ATTR, formType);

export const setFieldProcessed = (el: HTMLElement, fieldType: FormField): void =>
    el.setAttribute(PROCESSED_FIELD_ATTR, fieldType);

export const setFormProcessable = (el: HTMLElement): void => el.removeAttribute(PROCESSED_FORM_ATTR);
export const setFieldProcessable = (el: HTMLElement): void => el.removeAttribute(PROCESSED_FIELD_ATTR);

export const fieldProcessed = (el: HTMLElement): boolean => el.getAttribute(PROCESSED_FIELD_ATTR) !== null;
export const formProcessed = (el: HTMLElement): boolean => el.getAttribute(PROCESSED_FORM_ATTR) !== null;

export const fieldTrackable = isUserEditableField;
export const fieldProcessable = (el: HTMLInputElement): boolean => !fieldProcessed(el) && fieldTrackable(el);
