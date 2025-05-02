import { isHTMLElement } from '@proton/pass/utils/dom/predicates';
import { safeCall } from '@proton/pass/utils/fp/safe-call';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import lastItem from '@proton/utils/lastItem';

export const POPOVER_SUPPORTED = 'popover' in HTMLElement.prototype;

/** Keeps track of elements in the top-layer via the `toggle` event. Uses
 * a Set internally to preserve insertion order. Remove once there is a
 * proper DOM API to get an ordered list of top-layer elements. */
export const TopLayerManager = (() => {
    const TOP_LAYER_ELS = new Set<HTMLElement>(document.querySelectorAll(':modal, :popover-open'));
    const listeners = createListenerStore();

    const onToggle = ({ target }: Event) => {
        if (!target || !isHTMLElement(target)) return;
        if (!(target instanceof HTMLDialogElement || target.hasAttribute('popover'))) return;

        if (target.matches(':modal, :popover-open') && document.contains(target)) TOP_LAYER_ELS.add(target);
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

        get elements() {
            return Array.from(TOP_LAYER_ELS);
        },
    };
})();

export const showPopover = safeCall((target: HTMLElement) => target.showPopover());
export const hidePopover = safeCall((target: HTMLElement) => target.hidePopover());

/** Finds the closest ancestor element that creates a modal context and captures focus */
export const getClosestModal = (target: HTMLElement) => target.closest<HTMLElement>(':modal');

/** Returns the topmost modal element that's currently active in the document */
export const getActiveModal = () => lastItem(TopLayerManager.elements.filter((el) => el.matches(':modal'))) ?? null;
