import type { MaybeNull } from '@proton/pass/types';
import { findAssignedSlot } from '@proton/pass/utils/dom/custom-elements';
import { isHTMLElement } from '@proton/pass/utils/dom/predicates';
import { eq } from '@proton/pass/utils/fp/predicates';
import { safeCall } from '@proton/pass/utils/fp/safe-call';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import lastItem from '@proton/utils/lastItem';

export const POPOVER_SUPPORTED = 'popover' in HTMLElement.prototype || process.env.NODE_ENV === 'test';

export const safeMatch = (target: HTMLElement, selector: string): boolean =>
    safeCall(() => target.matches(selector))() ?? false;

export const safeQuery = (selector: string): HTMLElement[] =>
    safeCall(() => Array.from(document.querySelectorAll<HTMLElement>(selector)))() ?? [];

/** Duration (ms) to keep the top-layer considered poisoned after a foreign element
 * appeared above the guarded root. Prevents timing attacks where an attacker rapidly
 * cycles an overlay in/out of the top-layer to create brief windows where
 * `ensureTopLevel` would otherwise pass (e.g. via a 1ms setInterval). */
const POISON_WINDOW_MS = 150;

type TopLayerManagerState = {
    /** The popover element currently being protected against overlay intrusions. */
    guard: MaybeNull<HTMLElement>;
    /** Timestamp (via `performance.now`) of the last detected intrusion above `guard`. */
    poisonedAt: number;
};

/** Keeps track of elements in the top-layer via the `toggle` event. Uses
 * a Set internally to preserve insertion order. Remove once there is a
 * proper DOM API to get an ordered list of top-layer elements. */
export const TopLayerManager = (() => {
    const state: TopLayerManagerState = { guard: null, poisonedAt: -Infinity };

    /** Firefox ESR 115 regression: `:popover-open` selectors throw
     * errors in content script contexts due to incomplete CSS support.
     * Using `safeQuery` to gracefully handle these failures. */
    const popovers = safeQuery(':popover-open');
    const modals = safeQuery(':modal');

    const TOP_LAYER_ELS = new Set<HTMLElement>(popovers.concat(modals));
    const listeners = createListenerStore();

    const onToggle = ({ target }: Event) => {
        if (!target || !isHTMLElement(target)) return;
        if (!(target instanceof HTMLDialogElement || target.hasAttribute('popover'))) return;

        const { guard } = state;
        const matchTopLayer = safeMatch(target, ':modal') || safeMatch(target, ':popover-open');
        const isTopLayerEl = matchTopLayer && document.contains(target);

        /** Poison the guard when a foreign element enters the top-layer above it.
         * `TOP_LAYER_ELS.has(guard)` ensures the guard's own toggle event (which
         * fires before it is added to the set) is never treated as an intrusion. */
        if (isTopLayerEl && guard && TOP_LAYER_ELS.has(guard) && target !== guard) state.poisonedAt = performance.now();
        if (isTopLayerEl) TOP_LAYER_ELS.add(target);
        else TOP_LAYER_ELS.delete(target);
    };

    const onMutation: MutationCallback = (mutations) => {
        for (const { removedNodes } of mutations) {
            for (const node of removedNodes) {
                if (isHTMLElement(node)) TOP_LAYER_ELS.delete(node);
            }
        }
    };

    return {
        connect: () => {
            listeners.addListener(document, 'toggle', onToggle, { capture: true });
            listeners.addObserver(document.body, onMutation, { childList: true, subtree: true });
        },

        disconnect: () => listeners.removeAll(),

        /** Arms the guard for `element`. Any top-layer element entering above it
         * will poison `ensureTopLevel` for `POISON_WINDOW_MS`. Call after opening
         * the popover so the guard's own toggle event is not treated as an intrusion. */
        arm: (guard: HTMLElement) => {
            state.guard = guard;
            state.poisonedAt = -Infinity;
        },

        /** Disarms the guard when the protected popover closes. */
        disarm: () => {
            state.guard = null;
        },

        /** Ensures a given element is the top-most popover element. This should be
         * used to prevent popover clickjacking attacks where malicious sites could
         * use `pointer-events: none` to bypass standard detection methods
         * (`elementsAtPoint` doesn't detect elements with `pointer-events: none`). */
        ensureTopLevel: (element: HTMLElement): boolean => {
            if (POPOVER_SUPPORTED) {
                /** Reject if the top-layer was recently contaminated. This catches
                 * timing attacks where an overlay is cycled out just before the
                 * user's click event is processed (see `POISON_WINDOW_MS`). */
                if (performance.now() - state.poisonedAt < POISON_WINDOW_MS) return false;
                const popovers = TopLayerManager.elements;
                const rootIdx = popovers.findIndex(eq<HTMLElement>(element));
                if (rootIdx !== popovers.length - 1) return false;
            }

            return true;
        },

        get elements() {
            return Array.from(TOP_LAYER_ELS);
        },
    };
})();

export const showPopover = safeCall((target: HTMLElement) => target.showPopover());
export const hidePopover = safeCall((target: HTMLElement) => target.hidePopover());

/** Finds the closest ancestor element that creates a modal context and captures focus */
export const getClosestModal = (target: HTMLElement) =>
    target.closest<HTMLElement>(':modal') ??
    (() => {
        const slot = findAssignedSlot(target);
        return slot?.closest<HTMLElement>(':modal');
    })();

/** Returns the topmost modal element that's currently active in the document */
export const getActiveModal = () => lastItem(TopLayerManager.elements.filter((el) => el.matches(':modal'))) ?? null;
