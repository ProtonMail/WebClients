import {
    fieldOfInterestSelector,
    formOfInterestSelector,
    isUserEditableField,
    setFormType,
    setInputType,
} from '@proton/pass/fathom';
import { FormField, FormType } from '@proton/pass/types';

import { PROCESSED_FIELD_ATTR, PROCESSED_FORM_ATTR } from '../constants';

export const isNodeOfInterest = (node: Node) => node instanceof HTMLInputElement || node instanceof HTMLFormElement;

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
export const selectUnprocessedForms = (target: Document | HTMLElement = document) => {
    const selector = `${formOfInterestSelector}:not([${PROCESSED_FORM_ATTR}])`;
    return Array.from(target.querySelectorAll<HTMLElement>(selector));
};

/* dangling fields are fields that match our `fieldOfInterestSelector`
 * but have either not been processed or do not belong to a currently
 * tracked form */
export const selectDanglingFields = (target: Document | HTMLElement = document) => {
    const selector = `:not([${PROCESSED_FIELD_ATTR}]):not([${PROCESSED_FORM_ATTR}] input)`;
    const candidates = target.querySelectorAll<HTMLInputElement>(fieldOfInterestSelector);
    return Array.from(candidates).filter((el) => el.matches(selector));
};

export const selectUnprocessedFields = (target: Document | HTMLElement = document) => {
    const selector = `:not([${PROCESSED_FIELD_ATTR}])`;
    const candidates = target.querySelectorAll<HTMLInputElement>(fieldOfInterestSelector);
    return Array.from(candidates).filter((el) => el.matches(selector));
};

export const hasUnprocessedForms = (target?: Document | HTMLElement) => selectUnprocessedForms(target).length > 0;
export const hasUnprocessedFields = (target?: Document | HTMLElement) => selectUnprocessedFields(target).length > 0;

export const setFormProcessed = (el: HTMLElement, formType: FormType): void => {
    el.setAttribute(PROCESSED_FORM_ATTR, '');
    if (formType !== FormType.NOOP) setFormType(el, formType);
};

export const setFieldProcessed = (el: HTMLInputElement, fieldType: FormField): void => {
    el.setAttribute(PROCESSED_FIELD_ATTR, '');
    if (fieldType !== FormField.NOOP) setInputType(el, fieldType);
};

export const setFormProcessable = (el: HTMLElement): void => el.removeAttribute(PROCESSED_FORM_ATTR);
export const setFieldProcessable = (el: HTMLElement): void => el.removeAttribute(PROCESSED_FIELD_ATTR);

export const fieldProcessed = (el: HTMLElement): boolean => el.getAttribute(PROCESSED_FIELD_ATTR) !== null;
export const formProcessed = (el: HTMLElement): boolean => el.getAttribute(PROCESSED_FORM_ATTR) !== null;

export const fieldTrackable = isUserEditableField;
export const fieldProcessable = (el: HTMLInputElement): boolean => !fieldProcessed(el) && fieldTrackable(el);
