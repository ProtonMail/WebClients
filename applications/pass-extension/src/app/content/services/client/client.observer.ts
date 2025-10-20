import {
    hasProcessableFields,
    hasProcessableNodes,
    isAddedNodeOfInterest,
    isNodeOfInterest,
    isParentOfInterest,
    isRemovedNodeOfInterest,
    isUnprocessedInput,
} from 'proton-pass-extension/app/content/services/detector/detector.utils';

import {
    getIgnoredParent,
    getParentFormPrediction,
    isCustomElementWithShadowRoot,
    isPrediction,
    removeClassifierFlags,
    removeProcessedFlag,
} from '@proton/pass/fathom';
import type { MaybeNull } from '@proton/pass/types';
import { getActiveElement } from '@proton/pass/utils/dom/active-element';
import { TopLayerManager } from '@proton/pass/utils/dom/popover';
import { isHTMLElement, isInputElement } from '@proton/pass/utils/dom/predicates';
import { debounceBuffer } from '@proton/pass/utils/fp/control';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { logger } from '@proton/pass/utils/logger';
import type { Subscriber } from '@proton/pass/utils/pubsub/factory';
import { createPubSub } from '@proton/pass/utils/pubsub/factory';

type PageObserverState = {
    idle: boolean;
    /* mutation observer watching the DOM tree */
    observer: MaybeNull<MutationObserver>;
    /* mutations counter for sanity checks */
    staleMutationsCount: number;
};

const INPUT_ATTRIBUTES = ['type', 'id', 'name'];
const ATTRIBUTES_FILTER = ['style', 'class', ...INPUT_ATTRIBUTES];

const getObserverConfig = (attributeFilter: string[]): MutationObserverInit => ({
    childList: true,
    subtree: true,
    attributeFilter,
    attributes: true,
    attributeOldValue: true,
});

export type ClientObserver = {
    observe: () => void;
    destroy: () => void;
    subscribe: (fn: Subscriber<string>, options?: { once?: true }) => () => void;
};

export const createClientObserver = (): ClientObserver => {
    const pubsub = createPubSub<string>();
    const listeners = createListenerStore();
    const state: PageObserverState = {
        idle: true,
        observer: null,
        staleMutationsCount: 0,
    };

    /* If a new field was added to a currently ignored form :
     * reset all detection flags: the classification result
     * may change (ie: dynamic form recycling) */
    const onNewField = (target?: HTMLElement) => {
        const ignored = getIgnoredParent(target);
        if (ignored) removeClassifierFlags(ignored, { preserveIgnored: false });
    };

    /* If a field was deleted from a currently detected form :
     * reset all detection flags: the classification result
     * may change (ie: dynamic form recycling) */
    const onDeletedField = (target?: HTMLElement) => {
        const detected = target && isPrediction(target) ? target : getParentFormPrediction(target);
        if (detected) removeClassifierFlags(detected, { preserveIgnored: false });
    };

    /** DOM Mutation Observer for Form Detection:
     * Tracks mutations in `document.body` subtree to identify form changes
     * using heuristics. Observer configured to detect:
     * - New/deleted fields or forms (including unprocessed ones)
     * - Attribute changes on nodes of interest
     * - Dynamic input type changes that may affect detectors
     * - Auto-adjusts config to prevent mutation loops */
    const onMutation = (mutations: MutationRecord[]) => {
        const triggerFormChange = mutations.some((mutation) => {
            if (mutation.type === 'childList') {
                state.staleMutationsCount = 0;

                /** Skip irrelevant mutation targets early */
                if (!isParentOfInterest(mutation.target)) return false;

                const deletedFields = Array.from(mutation.removedNodes).some(isRemovedNodeOfInterest);
                const addedFields = Array.from(mutation.addedNodes).some(isAddedNodeOfInterest);

                if (addedFields) onNewField(mutation.target as HTMLElement);
                if (deletedFields) onDeletedField(mutation.target as HTMLElement);

                return addedFields || deletedFields;
            }

            if (mutation.type === 'attributes') {
                /** Skip irrelevant nodes early */
                if (!isNodeOfInterest(mutation.target)) return false;

                const { oldValue, attributeName, target } = mutation;
                const current = attributeName ? target?.getAttribute(attributeName) : null;

                if (isInputElement(mutation.target)) {
                    /** Handle changes to attributes of input elements that weren't initially tracked.
                     * For example: a form might be initially filtered out because it had no tracked
                     * fields, but a change to an input's 'type' attribute could make it trackable.
                     * IE: account.proton.me/mail/filters modal forms */
                    const fieldChange = Boolean(attributeName && INPUT_ATTRIBUTES.includes(attributeName));
                    if (fieldChange) removeProcessedFlag(target);
                    return fieldChange;
                }

                if (oldValue !== null && oldValue === current) state.staleMutationsCount++;
                else state.staleMutationsCount = 0;

                /** If we've detected 25 consecutive attribute mutations without changes,
                 * it suggests a potential loop scenario with the MutationObserver. In such
                 * cases, we filter out the specific attribute from further observation to
                 * prevent the loop from continuing. This is a precautionary measure to address
                 * certain configurations that can trigger mutation observer loops */
                if (state.staleMutationsCount > 25) {
                    const config = getObserverConfig(ATTRIBUTES_FILTER.filter((attr) => attr !== attributeName));
                    state.observer?.disconnect();
                    state.observer = listeners.addObserver(document.body, onMutation, config);
                }

                return hasProcessableFields(target);
            }

            return false;
        });

        if (triggerFormChange) void pubsub.publish('DomMutation');
    };

    /** Detect forms after DOM transitions:
     * Debounced listener on `document.body` triggers detection filter
     * when transitions complete. Helps identify forms that may have
     * been filtered out by initial ML pass. Only processes if unhandles
     * nodes exist, with optimized batching (full scan if batch >= 10) */
    const onTransitionEnd = debounceBuffer<Event, HTMLElement>(
        (targets) => {
            /** Avoid blocking render */
            requestAnimationFrame(() => {
                const trigger = ((): boolean => {
                    /** For large batches: check the full document as we
                     * may be dealing with a complex page transition */
                    if (targets.length >= 15 && hasProcessableNodes(document.body)) return true;

                    /** Else check each transition target for processable
                     * nodes. Early exits on first match. */
                    for (const target of targets) {
                        try {
                            /** Exit early if body scan found nothing */
                            if (hasProcessableNodes(target)) return true;
                            else if (target === document.body) return false;
                        } catch {}
                    }

                    return false;
                })();

                if (trigger) pubsub.publish('TransitionEnd');
            });
        },
        /** Filter targets to relevant elements before subtree check */
        ({ target }: Event) => (target && isParentOfInterest(target) ? target : false),
        250,
        { leading: true }
    );

    /** Fallback detection trigger for inputs missed by other detection triggers
     * (page load, DOM mutations, transitions). Only processes valid, unprocessed
     * inputs that aren't explicitly ignored. */
    const onFocusIn = ({ target }: Event) => {
        if (target && isHTMLElement(target)) {
            const trigger = (() => {
                if (isUnprocessedInput(target)) return true;

                /** Custom elements may encapsulate the actual active
                 * input element within their shadow DOM */
                if (isCustomElementWithShadowRoot(target)) {
                    const active = getActiveElement(target.shadowRoot);
                    return active && isHTMLElement(active) && isUnprocessedInput(active);
                }

                return false;
            })();

            if (trigger) void pubsub.publish('FocusIn');
        }
    };

    const observe = () => {
        if (state.idle) {
            logger.debug('[PageObserver] watching for changes..');
            state.idle = false;
            state.observer = listeners.addObserver(document.body, onMutation, getObserverConfig(ATTRIBUTES_FILTER));
            listeners.addListener(document.body, 'transitionend', onTransitionEnd);
            listeners.addListener(document.body, 'animationend', onTransitionEnd);
            listeners.addListener(document.body, 'focusin', onFocusIn);
            TopLayerManager.connect();
        }
    };

    const destroy = () => {
        logger.debug('[PageObserver] Destroyed');
        pubsub.unsubscribe();
        listeners.removeAll();
        onTransitionEnd.cancel();
        TopLayerManager.disconnect();
        state.observer = null;
        state.idle = true;
    };

    return {
        observe,
        destroy,
        subscribe: (subscriber, options) => {
            const unsub = pubsub.subscribe((reason) => {
                void subscriber(reason);
                if (options?.once) unsub();
            });

            return unsub;
        },
    };
};
