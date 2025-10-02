import { findInputBoundingElement } from '@proton/pass/utils/dom/input';
import { createListenerStore } from '@proton/pass/utils/listener/factory';

/* Provides a handle for field bounding box revalidation and animation state for icon positioning triggers */
export interface FieldAnchor {
    animating: boolean;
    element: HTMLElement;
    disconnect: () => void;
    observe: () => void;
    revalidate: () => void;
}

export const createFieldAnchor = (element: HTMLElement) => {
    const listeners = createListenerStore();

    const state = {
        anchor: findInputBoundingElement(element),
        animating: false,
        connected: false,
    };

    /* Listen for CSS transitions to track element animation state */
    const observe = () => {
        if (!state.connected) {
            state.connected = true;
            listeners.removeAll();

            const onTransitionEnd = () => {
                state.animating = false;
                observe();
            };

            const onTransition = () => {
                if (!state.animating) {
                    state.animating = true;
                    listeners.addListener(state.anchor, 'transitionend', onTransitionEnd, {
                        passive: true,
                        once: true,
                    });
                }
            };

            listeners.addListener(state.anchor, 'transitionrun', onTransition, { passive: true, once: true });
            listeners.addListener(state.anchor, 'transitionstart', onTransition, { passive: true, once: true });
        }
    };

    return {
        get element() {
            return state.anchor;
        },
        get animating() {
            return state.animating;
        },
        revalidate: () => {
            const next = findInputBoundingElement(element);
            if (next !== state.anchor) {
                state.animating = false;
                state.anchor = next;
                listeners.removeAll();
                observe();
            }
        },
        observe,
        disconnect: () => {
            state.connected = false;
            listeners.removeAll();
        },
    };
};
