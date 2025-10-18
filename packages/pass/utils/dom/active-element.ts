import type { MaybeNull } from '@proton/pass/types/utils';

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
