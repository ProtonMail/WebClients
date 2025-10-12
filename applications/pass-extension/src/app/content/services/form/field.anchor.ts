import { findInputBoundingElement } from '@proton/pass/utils/dom/input';
import { createListenerStore } from '@proton/pass/utils/listener/factory';

/* Provides a handle for field bounding box revalidation and animation state for icon positioning triggers */
export interface FieldAnchor {
    animating: boolean;
    element: HTMLElement;
    connect: () => void;
    disconnect: () => void;
    revalidate: () => void;
}

export const createFieldAnchor = (element: HTMLElement) => {
    const listeners = createListenerStore();

    const state = {
        anchor: findInputBoundingElement(element),
        animating: false,
        connected: false,
    };

    const disconnect = () => {
        state.connected = false;
        state.animating = false;
        listeners.removeAll();
    };

    /* Listen for CSS transitions to track element animation state */
    const connect = () => {
        if (!state.connected) {
            state.connected = true;
            listeners.removeAll();
            const onTransition = () => !state.animating && (state.animating = true);

            listeners.addListener(state.anchor, 'transitionrun', onTransition, { once: true });
            listeners.addListener(state.anchor, 'transitionstart', onTransition, { once: true });
            listeners.addListener(state.anchor, 'transitionend', disconnect, { once: true });
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
                state.anchor = next;
                disconnect();
            }
        },
        connect,
        disconnect,
    };
};
