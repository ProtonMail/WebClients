import { withContext } from 'proton-pass-extension/app/content/context/context';
import { createFormHandles } from 'proton-pass-extension/app/content/services/handles/form';
import type { FormHandle } from 'proton-pass-extension/app/content/types';
import {
    hasProcessableFields,
    hasProcessableForms,
    isAddedNodeOfInterest,
    isRemovedNodeOfInterest,
} from 'proton-pass-extension/app/content/utils/nodes';

import {
    FieldType,
    clearDetectionCache,
    getIgnoredParent,
    getParentFormPrediction,
    isPrediction,
    removeClassifierFlags,
    removeProcessedFlag,
} from '@proton/pass/fathom';
import { type MaybeNull } from '@proton/pass/types';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { logger } from '@proton/pass/utils/logger';
import debounce from '@proton/utils/debounce';
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

            ctx?.service.detector.applyRules();

            if (await ctx?.service.detector.shouldRunDetection()) {
                state.detectionRequest = requestIdleCallback(async () => {
                    if (state.active) {
                        logger.info(`[FormTracker::Detector] Running detection for "${reason}"`);

                        try {
                            const forms = ctx?.service.detector.runDetection({ onBottleneck, excludedFieldTypes });

                            forms?.forEach((options) => {
                                const formHandle = state.trackedForms.get(options.form) ?? createFormHandles(options);
                                state.trackedForms.set(options.form, formHandle);
                                formHandle.reconciliate(options.formType, options.fields);
                                formHandle.attach();
                            });

                            /* Always prompt for OTP autofill before autosave. */
                            await ctx?.service.autofill.sync().catch(noop);
                            const prompted = await ctx?.service.autofill.promptOTP();
                            await (!prompted && ctx?.service.autosave.reconciliate());

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

    /* if a new field was added to a currently ignored form :
     * reset all detection flags: the classification result
     * may change (ie: dynamic form recycling) */
    const onNewField = (target?: HTMLElement) => {
        const ignored = getIgnoredParent(target);
        if (ignored) removeClassifierFlags(ignored, { preserveIgnored: false });
    };

    /* if a field was deleted from a currently detected form :
     * reset all detection flags: the classification result
     * may change (ie: dynamic form recycling) */
    const onDeletedField = (target?: HTMLElement) => {
        const detected = target && isPrediction(target) ? target : getParentFormPrediction(target);
        if (detected) removeClassifierFlags(detected, { preserveIgnored: false });
    };

    /**
     * Form Detection Trigger via DOM Mutation :
     *
     * This mutation observer handler is set up to track changes on the DOM,
     * specifically looking for mutations related to form or field elements.
     * It employs a combination of heuristics to determine whether the observed
     * mutations contain changes that warrant running the detection algorithm.
     *
     * The observer is configured to listen for mutations in the subtree of
     * the document body, including changes to the 'style' and 'aria-hidden'
     * attributes (this handles the case for certain modals being pre-rendered
     * in the DOM not being currently tracked)
     * The callback analyzes the mutations and checks for the following :
     * · New input fields, forms, or elements with unprocessed fields
     * · Deleted input fields or forms being removed from the DOM
     * · Attribute changes in elements with unprocessed fields
     *
     * If any of the mutations indicate relevant changes, the detection algorithm
     * is triggered. Note: The heuristic checks may need further fine-tuning to
     * ensure all relevant mutations are captured.*/
    const onMutation = (mutations: MutationRecord[]) => {
        const triggerFormChange = mutations.some((mutation) => {
            if (mutation.type === 'childList') {
                state.staleMutationsCount = 0;

                const deletedFields = Array.from(mutation.removedNodes).some(isRemovedNodeOfInterest);
                const addedFields = Array.from(mutation.addedNodes).some(isAddedNodeOfInterest);

                if (addedFields) onNewField(mutation.target as HTMLElement);
                if (deletedFields) onDeletedField(mutation.target as HTMLElement);

                return addedFields || deletedFields;
            }

            if (mutation.type === 'attributes') {
                const { oldValue, attributeName } = mutation;
                const target = mutation.target as HTMLElement;
                const current = attributeName ? target?.getAttribute(attributeName) : null;

                if (target instanceof HTMLInputElement) {
                    /** Handle changes to attributes of input elements that weren't initially tracked.
                     * For example: a form might be initially filtered out because it had no tracked
                     * fields, but a change to an input's 'type' attribute could make it trackable.
                     * IE: account.proton.me/mail/filters modal forms */
                    const fieldChange = Boolean(attributeName && INPUT_ATTRIBUTES.includes(attributeName));
                    if (fieldChange) removeProcessedFlag(target);
                    return fieldChange;
                }

                if (target.childElementCount === 0) return false;

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

    /**
     * Form Detection Trigger via Transition Events
     *
     * We want to avoid swarming detection requests on every `transitionend`
     * event as we are listening for them on the `document.body` and will
     * catch all bubbling events. The function is debounced to ensure it runs
     * only when necessary, and only if there are unprocessed forms in the DOM.
     * · Remove stale seen fields in case the transition would have affected the
     *   underlying field features
     * · The detection is executed only if there are unprocessed forms
     * · The purpose is to catch appearing forms that may have been previously
     *   filtered out by the ML algorithm when it was first triggered */
    const onTransitionEnd = debounce(
        ({ target }: Event) =>
            requestAnimationFrame(() => {
                if (target instanceof HTMLElement) {
                    if (hasProcessableForms(target) || hasProcessableFields(target)) {
                        void detect({ reason: 'TransitionEnd' });
                    }
                }
            }),
        250,
        { leading: true }
    );

    const observe = () => {
        if (!state.active) {
            state.active = true;
            state.observer = listeners.addObserver(document.body, onMutation, getObserverConfig(ATTRIBUTES_FILTER));
            listeners.addListener(document.body, 'transitionend', onTransitionEnd);
            listeners.addListener(document.body, 'animationend', onTransitionEnd);
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
