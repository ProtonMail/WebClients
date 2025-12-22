import type { MaybeNull } from '@proton/pass/types/utils/index';

export interface InteractivityController {
    /** Locks field interactivity for the provided duration.
     * (defaults to maximum 250ms value) */
    lock: (release?: number) => void;
    /** Releases interactivity lock */
    unlock: () => void;
}

type InteractivityState = {
    timeout: MaybeNull<NodeJS.Timeout>;
};

/** Cap auto-release at 250ms to prevent indefinite locks */
const MAX_INERT_TIMEOUT = 250;

/** Creates a controller to temporarily lock user interaction on an element.
 * Uses the `inert` attribute which makes elements non-interactive: clicks,
 * focus, and keyboard events are ignored.  */
export const createInteractivityController = (element: HTMLElement): InteractivityController => {
    const state: InteractivityState = { timeout: null };

    return {
        lock: (timeout = MAX_INERT_TIMEOUT) => {
            if (state.timeout) clearTimeout(state.timeout);
            element.inert = true;

            const releaseTimeout = Math.min(timeout, MAX_INERT_TIMEOUT);
            state.timeout = setTimeout(() => {
                element.inert = false;
                state.timeout = null;
            }, releaseTimeout);
        },

        unlock: () => {
            if (state.timeout) {
                clearTimeout(state.timeout);
                state.timeout = null;
            }

            element.inert = false;
        },
    };
};
