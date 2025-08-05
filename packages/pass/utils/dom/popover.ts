import { findAssignedSlot } from '@proton/pass/utils/dom/custom-elements';
import { isHTMLElement } from '@proton/pass/utils/dom/predicates';
import { eq } from '@proton/pass/utils/fp/predicates';
import { safeCall } from '@proton/pass/utils/fp/safe-call';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import lastItem from '@proton/utils/lastItem';

export const POPOVER_SUPPORTED = 'popover' in HTMLElement.prototype;

export const safeMatch = (target: HTMLElement, selector: string): boolean =>
    safeCall(() => target.matches(selector))() ?? false;

export const safeQuery = (selector: string): HTMLElement[] =>
    safeCall(() => Array.from(document.querySelectorAll<HTMLElement>(selector)))() ?? [];

/** Keeps track of elements in the top-layer via the `toggle` event. Uses
 * a Set internally to preserve insertion order. Remove once there is a
 * proper DOM API to get an ordered list of top-layer elements. */
export const TopLayerManager = (() => {
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

        const matchTopLayer = safeMatch(target, ':modal') || safeMatch(target, ':popover-open');
        if (matchTopLayer && document.contains(target)) TOP_LAYER_ELS.add(target);
        else TOP_LAYER_ELS.delete(target);
    };

    const onMutation: MutationCallback = (mutations) => {
        for (const { removedNodes } of mutations) {
            for (const node of removedNodes) {
                if (isHTMLElement(node)) TOP_LAYER_ELS.delete(node);
            }
        }
    };

    listeners.addListener(document, 'toggle', onToggle, { capture: true });
    listeners.addObserver(document.body, onMutation, { childList: true, subtree: true });

    return {
        disconnect: () => listeners.removeAll(),

        /** Ensures a given element is the top-most popover element. This should be
         * used to prevent popover clickjacking attacks where malicious sites could
         * use `pointer-events: none` to bypass standard detection methods
         * (`elementsAtPoint` doesn't detect elements with `pointer-events: none`). */
        ensureTopLevel: (element: HTMLElement): boolean => {
            if (POPOVER_SUPPORTED) {
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
