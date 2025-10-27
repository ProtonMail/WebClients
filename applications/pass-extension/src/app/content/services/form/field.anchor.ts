import { findInputBoundingElement } from '@proton/pass/utils/dom/input';

/* Provides a handle for field bounding box revalidation */
export interface FieldAnchor {
    element: HTMLElement;
    revalidate: () => void;
}

type FieldAnchorState = { anchor: HTMLElement };

export const createFieldAnchor = (element: HTMLInputElement) => {
    const state: FieldAnchorState = { anchor: findInputBoundingElement(element) };

    return {
        get element() {
            return state.anchor;
        },

        revalidate: () => {
            const next = findInputBoundingElement(element);
            if (next !== state.anchor) {
                state.anchor = next;
            }
        },
    };
};
