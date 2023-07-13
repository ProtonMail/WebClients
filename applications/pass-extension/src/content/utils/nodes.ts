import { isActiveField, isFieldProcessed, selectUnprocessedForms, selectUnprocessedInputs } from '@proton/pass/fathom';

export const hasUnprocessedForms = (doc?: Document) => selectUnprocessedForms(doc).length > 0;
export const hasUnprocessedFields = (target?: Document | HTMLElement) => selectUnprocessedInputs(target).length > 0;

export const fieldProcessable = (el: HTMLInputElement): boolean => !isFieldProcessed(el) && isActiveField(el);

export const isNodeOfInterest = (node: Node): node is HTMLElement =>
    node instanceof HTMLInputElement ||
    node instanceof HTMLFormElement ||
    (node instanceof HTMLElement && (hasUnprocessedFields(node) || node.querySelector('input') !== null));
