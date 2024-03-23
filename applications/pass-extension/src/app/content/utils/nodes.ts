import {
    inputCandidateSelector,
    isIgnored,
    isPrediction,
    isProcessed,
    removeProcessedFlag,
    selectFormCandidates,
    selectInputCandidates,
} from '@proton/pass/fathom';
import { invert } from '@proton/pass/utils/fp/predicates';

const unprocessed = invert(isProcessed);

export const hasUnprocessedForms = () => selectFormCandidates().some(unprocessed);
export const hasUnprocessedFields = (target?: Document | HTMLElement) =>
    selectInputCandidates(target).some(unprocessed);

export const purgeStaleSeenFields = (target?: HTMLElement) => {
    target?.querySelectorAll<HTMLElement>(inputCandidateSelector).forEach((el) => {
        if (!(isIgnored(el) || isPrediction(el))) removeProcessedFlag(el);
    });
};

export const isNodeOfInterest = (node: Node): node is HTMLElement =>
    node instanceof HTMLInputElement ||
    node instanceof HTMLFormElement ||
    (node instanceof HTMLElement && hasUnprocessedFields(node));
