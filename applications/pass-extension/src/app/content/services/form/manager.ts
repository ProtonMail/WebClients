import { withContext } from 'proton-pass-extension/app/content/context/context';
import { createFormHandles } from 'proton-pass-extension/app/content/services/handles/form';
import type { FormHandle } from 'proton-pass-extension/app/content/types';
import {
    getActiveElement,
    hasProcessableFields,
    hasProcessableNodes,
    isAddedNodeOfInterest,
    isNodeOfInterest,
    isParentOfInterest,
    isRemovedNodeOfInterest,
    isUnprocessedInput,
} from 'proton-pass-extension/app/content/utils/nodes';

import {
    FieldType,
    clearDetectionCache,
    getIgnoredParent,
    getParentFormPrediction,
    isCustomElementWithShadowRoot,
    isPrediction,
    removeClassifierFlags,
    removeProcessedFlag,
} from '@proton/pass/fathom';
import { type MaybeNull } from '@proton/pass/types';
import { isHTMLElement, isInputElement } from '@proton/pass/utils/dom/predicates';
import { debounceBuffer } from '@proton/pass/utils/fp/control';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { logger } from '@proton/pass/utils/logger';
import noop from '@proton/utils/noop';
import throttle from '@proton/utils/throttle';

type FormManagerOptions = { onDetection: (forms: FormHandle[]) => void };

export type FormManagerState = {
    /* form manager state flag */
    active: boolean;
    /** last detection run */
    detectionAt: number;
    /** number of detections executed */
    detectionCount: number;
    /* detection request */
    detectionRequest: number;
    /* mutation observer watching the DOM tree */
    observer: MaybeNull<MutationObserver>;
    /* mutations counter for sanity checks */
    staleMutationsCount: number;
    /* tracked forms have been detected */
    trackedForms: Map<HTMLElement, FormHandle>;
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

export const createFormManager = (options: FormManagerOptions) => {
    const state: FormManagerState = {
        active: false,
        detectionAt: 0,
        detectionCount: 0,
        detectionRequest: -1,
        observer: null,
        staleMutationsCount: 0,
        trackedForms: new Map(),
    };

    const listeners = createListenerStore();
    const getTrackedForms = () => Array.from(state.trackedForms.values());

    const detachTrackedForm = (formEl: HTMLElement) => {
        state.trackedForms.get(formEl)?.detach();
        state.trackedForms.delete(formEl);
    };

    /* Garbage collection is used to detach tracked forms if they have been
     * removed from the DOM - this may be the case in SPA apps. Once a form
     * is detected, it will be tracked until removed */
    const garbagecollect = (didDetach: boolean = false): boolean => {
        state.trackedForms.forEach((form) => {
            if (form.detached) {
                detachTrackedForm(form.element);
                didDetach = true;
            }
        });

        return didDetach;
    };

    const onBottleneck = withContext((ctx) => {
        logger.info(`[FormManager::Detector] Bottleneck detected : destroying context.`);
        ctx?.destroy({ reason: 'bottleneck' });
    });

    /**
     * Asynchronously runs form detection with throttling to optimize performance.
     * Uses a combination of throttle, leading/trailing edge, and requestIdleCallback
     * mechanisms to prevent UI blocking and efficiently manage detection tasks.
     * - Recycles and/or creates form handles for each detected form and reconciliates accordingly.
     * - Performs autosave reconciliation on each detection run to capture any changes made to form data.
     * - Returns a boolean flag indicating whether the detection was executed successfully
     */
    const runDetection = throttle(
        withContext<(reason: string) => Promise<boolean>>(async (ctx, reason: string) => {
            const settings = ctx?.getSettings();
            const features = ctx?.getFeatures();
            const detectIdentity = Boolean(features?.Autofill && settings?.autofill.identity);
            const excludedFieldTypes: FieldType[] = [];

            if (!detectIdentity) excludedFieldTypes.push(FieldType.IDENTITY);
            if (!features?.Autofill2FA) excludedFieldTypes.push(FieldType.OTP);

            /* if there is an on-going detection, early return */
            if (state.detectionRequest !== -1) return false;
            const gcd = garbagecollect();

            if (await ctx?.service.detector.shouldRunDetection()) {
                state.detectionRequest = requestIdleCallback(() => {
                    if (state.active) {
                        logger.debug(`[FormTracker::Detector] Running detection for "${reason}"`);

                        try {
                            const forms = ctx?.service.detector.runDetection({ onBottleneck, excludedFieldTypes });
                            forms?.forEach((options) => {
                                const formHandle = state.trackedForms.get(options.form) ?? createFormHandles(options);
                                state.trackedForms.set(options.form, formHandle);
                                formHandle.reconciliate(options.formType, options.fields);
                                formHandle.attach();
                            });

                            options.onDetection(getTrackedForms());
                        } catch (err) {
                            logger.warn(`[FormTracker::Detector] ${err}`);
                        }
                    }

                    /* reset detection state when finished */
                    state.detectionRequest = -1;
                    state.detectionCount++;
                });

                return true;
            }

            if (gcd || state.detectionCount === 0) void ctx?.service.autosave.reconciliate();
            clearDetectionCache();

            return false;
        }),
        250,
        { leading: true, trailing: true }
    );

    const detect = async (options: { reason: string }) => {
        /* If `detect` calls are inundated due to concurrent DOM mutations or transition events,
         * this function cancels ongoing detection requests if they occur too closely together—
         * set heuristically to 150ms. This prevents triggering detectors on a transitioning page,
         * which may still have DOM nodes affecting final prediction results. This condition only
         * applies to subsequent detection runs, prioritizing the speed of the initial detection. */
        const now = Date.now();
        const cancel = !state.active || (state.detectionCount > 0 && now - state.detectionAt < 150);
        state.detectionAt = now;

        if (cancel) {
            cancelIdleCallback(state.detectionRequest);
            state.detectionRequest = -1;
        }

        if (!state.active) return;

        void runDetection(options.reason);
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

        if (triggerFormChange) void detect({ reason: 'DomMutation' });
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

                if (trigger) void detect({ reason: 'TransitionEnd' });
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

            if (trigger) void detect({ reason: 'FocusIn' });
        }
    };

    const observe = () => {
        if (!state.active) {
            state.active = true;
            state.observer = listeners.addObserver(document.body, onMutation, getObserverConfig(ATTRIBUTES_FILTER));

            listeners.addListener(document.body, 'transitionend', onTransitionEnd);
            listeners.addListener(document.body, 'animationend', onTransitionEnd);
            listeners.addListener(document.body, 'focusin', onFocusIn);
        }
    };

    const destroy = () => {
        cancelIdleCallback(state.detectionRequest);
        runDetection.cancel();
        onTransitionEnd.cancel();

        state.active = false;
        state.detectionRequest = -1;
        state.observer = null;
        state.staleMutationsCount = 0;
        state.detectionCount = 0;

        listeners.removeAll();

        state.trackedForms.forEach((form) => detachTrackedForm(form.element));
        state.trackedForms.clear();
    };

    const sync = withContext((ctx) => {
        state.trackedForms.forEach((form) => form.tracker?.reconciliate());
        ctx?.service.autofill.sync().catch(noop);
    });

    return { getTrackedForms, observe, detect, sync, destroy };
};

export type FormManager = ReturnType<typeof createFormManager>;
