import {
    isHidden,
    isIgnored,
    isProcessed,
    selectFormCandidates,
    selectInputCandidates,
    shallowShadowQuerySelector,
} from '@proton/pass/fathom';
import type { MaybeNull } from '@proton/pass/types';
import { isFormElement, isHTMLElement, isInputElement } from '@proton/pass/utils/dom/predicates';
import { not, or } from '@proton/pass/utils/fp/predicates';

/** Elements excluded from form/field container checks.
 * Use with `childElementCount` to also skip leaf nodes. */
export const IGNORED_TAGS = new Set([
    'PICTURE',
    'VIDEO',
    'AUDIO',
    'BUTTON',
    'A',
    'SCRIPT',
    'NOSCRIPT',
    'LINK',
    'OBJECT',
    'IFRAME',
    /** svg `tagNames` are always lowercased
     * on `Element.tagName` */
    'svg',
    'g',
]);

export const IGNORED_ROLES = new Set(['button', 'link', 'menuitem', 'checkbox', 'radio', 'switch']);

export const isUnprocessed = not(or(isProcessed, isIgnored));

export const hasProcessableForms = (target?: Document | HTMLElement) =>
    selectFormCandidates(target).some(or(isUnprocessed, isHidden));

export const hasProcessableFields = (target?: Document | HTMLElement) =>
    selectInputCandidates(target).some(or(isUnprocessed, isHidden));

export const hasProcessableNodes = or(hasProcessableForms, hasProcessableFields);

/** Filters potential form/field containers by:
 * - Valid HTMLElement with children
 * - Non-blacklisted ARIA roles
 * - Non-blacklisted HTML tags
 * Used to optimize mutation/transition checks */
export const isParentOfInterest = (node: Node | EventTarget): node is HTMLElement => {
    if (!isHTMLElement(node)) return false;
    if (node.childElementCount === 0) return false;
    if (node.role && IGNORED_ROLES.has(node.role)) return false;
    return !IGNORED_TAGS.has(node.tagName);
};

const isNodeOfInterestFactory =
    (subtreeCheck: (el: HTMLElement) => boolean) =>
    (node: Node | EventTarget): node is HTMLElement =>
        isInputElement(node) || isFormElement(node) || (isHTMLElement(node) && subtreeCheck(node));

export const isNodeOfInterest = isNodeOfInterestFactory(isParentOfInterest);
export const isAddedNodeOfInterest = isNodeOfInterestFactory(hasProcessableFields);
export const isRemovedNodeOfInterest = isNodeOfInterestFactory((el) => el.querySelector('form, input') !== null);

export const selectNodeFromPath = (root: HTMLElement | Document, [head, ...tail]: string[]): MaybeNull<HTMLElement> => {
    const start = shallowShadowQuerySelector(root, head);
    if (!start) return null;

    return tail.reduce<MaybeNull<HTMLElement>>((parent, next) => {
        if (parent === null) return null;
        return shallowShadowQuerySelector(parent, next);
    }, start);
};

export const getActiveElement = (start: Document | ShadowRoot = document): MaybeNull<Element> => {
    const traverse = (root: Document | ShadowRoot): MaybeNull<Element> => {
        const active = root.activeElement;
        if (!active) return null;
        if (active.shadowRoot) return traverse(active.shadowRoot);
        return active;
    };

    return traverse(start);
};

export const isActiveElement = (target?: HTMLElement): boolean => {
    if (!target) return false;
    return target === getActiveElement();
};
