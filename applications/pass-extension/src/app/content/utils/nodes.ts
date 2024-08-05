import {
    inputCandidateSelector,
    isHidden,
    isIgnored,
    isPrediction,
    isProcessed,
    removeProcessedFlag,
    selectFormCandidates,
    selectInputCandidates,
} from '@proton/pass/fathom';
import { not, or } from '@proton/pass/utils/fp/predicates';

const unprocessed = not(isProcessed);

export const hasProcessableForms = (target?: Document | HTMLElement) =>
    selectFormCandidates(target).some(or(unprocessed, isHidden));

export const hasProcessableFields = (target?: Document | HTMLElement) =>
    selectInputCandidates(target).some(or(unprocessed, isHidden));

export const purgeStaleSeenFields = (target?: HTMLElement) => {
    target?.querySelectorAll<HTMLElement>(inputCandidateSelector).forEach((el) => {
        if (!(isIgnored(el) || isPrediction(el))) removeProcessedFlag(el);
    });
};

const isNodeOfInterestFactory =
    (subtreeCheck: (el: HTMLElement) => boolean) =>
    (node: Node): node is HTMLElement =>
        node instanceof HTMLInputElement ||
        node instanceof HTMLFormElement ||
        (node instanceof HTMLElement && subtreeCheck(node));

export const isAddedNodeOfInterest = isNodeOfInterestFactory(hasProcessableFields);
export const isRemovedNodeOfInterest = isNodeOfInterestFactory((el) => el.querySelector('form, input') !== null);
