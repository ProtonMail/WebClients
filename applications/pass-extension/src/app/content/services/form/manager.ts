import { withContext } from 'proton-pass-extension/app/content/context/context';
import { createFormHandles } from 'proton-pass-extension/app/content/services/handles/form';
import type { FormHandle } from 'proton-pass-extension/app/content/types';
import {
    hasUnprocessedFields,
    hasUnprocessedForms,
    isNodeOfInterest,
} from 'proton-pass-extension/app/content/utils/nodes';

import {
    clearDetectionCache,
    getIgnoredParent,
    getParentFormPrediction,
    removeClassifierFlags,
} from '@proton/pass/fathom';
import type { MaybeNull } from '@proton/pass/types';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { logger } from '@proton/pass/utils/logger';
import debounce from '@proton/utils/debounce';

type FormManagerOptions = { onDetection: (forms: FormHandle[]) => void };

export type FormManagerState = {
    /* form manager state flag */
    active: boolean;
    /* ongoing detection flag */
    busy: boolean;
    /* detection request */
    detectionRequest: number;
    observer: MaybeNull<MutationObserver>;
    /* mutations counter for sanity checks */
    staleMutationsCount: number;
    /* tracked forms have been detected */
    trackedForms: Map<HTMLElement, FormHandle>;
};

const ATTRIBUTES_FILTER = ['style', 'class'];
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
        busy: false,
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

    /* Garbage collection is used to detach tracked forms
     * if they have been removed from the DOM - this may be the case
     * in SPA apps. Once a form is detected, it will be tracked until
     * removed : form visibility changes have no effect on detachment
     * for performance reasons (costly `isVisible` check) */
    const garbagecollect = () => {
        state.trackedForms.forEach((form) => {
            if (form.shouldRemove()) {
                form.tracker?.submit();
                detachTrackedForm(form.element);
            }
        });
    };

    /**
     * Run form detection asynchronously in an idle callback to prevent UI blocking.
     * - Trigger garbage collection on each detection run to ensure accurate autosave &
     *   autofill reconciliation against the current page state.
     * - Recycle/create form handles and reconcile their fields for each detected form.
     * - Reconcile autosave on each detection run.
     * - Returns a boolean flag indicating whether the detection was executed.
     */
    const runDetection = debounce(
        withContext<(reason: string) => Promise<boolean>>(async (ctx, reason: string) => {
            garbagecollect();
            if (await ctx?.service.detector.shouldRunDetection()) {
                state.detectionRequest = requestIdleCallback(async () => {
                    state.busy = true;

                    if (state.active) {
                        logger.info(`[FormTracker::Detector] Running detection for "${reason}"`);

                        try {
                            const forms = ctx?.service.detector.runDetection({
                                onBottleneck: () => ctx?.destroy({ reason: 'bottleneck' }),
                            });

                            forms?.forEach((options) => {
                                const formHandle = state.trackedForms.get(options.form) ?? createFormHandles(options);
                                state.trackedForms.set(options.form, formHandle);
                                formHandle.reconciliate(options.formType, options.fields);
                                formHandle.attach();
                            });

                            /* Prompt for 2FA autofill before autosave */
                            const didPrompt = await ctx?.service.autofill.reconciliate();
                            await (!didPrompt && ctx?.service.autosave.reconciliate());

                            options.onDetection(getTrackedForms());
                            state.busy = false;
                        } catch (err) {
                            logger.warn(`[FormTracker::Detector] ${err}`);
                        }
                    }
                });

                return true;
            } else clearDetectionCache();

            state.busy = false;
            void ctx?.service.autosave.reconciliate();
            return false;
        }),
        250
    );

    const detect = async (options: { reason: string; flush?: boolean }) => {
        if (state.busy || !state.active) return false;
        cancelIdleCallback(state.detectionRequest);

        if (options.flush) {
            void runDetection(options.reason);
            return Boolean(await runDetection.flush());
        }

        return Boolean(await runDetection(options.reason));
    };

    /* if a new field was added to a currently ignored form :
     * reset all detection flags: the classification result
     * may change (ie: dynamic form recycling) */
    const onNewField = (field?: HTMLElement) => {
        const ignored = getIgnoredParent(field);
        if (ignored) removeClassifierFlags(ignored);
    };

    /* if a field was deleted from a currently detected form :
     * reset all detection flags: the classification result
     * may change (ie: dynamic form recycling) */
    const onDeletedField = (field?: HTMLElement) => {
        const detected = getParentFormPrediction(field);
        if (detected) removeClassifierFlags(detected);
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

                const deletedFields = Array.from(mutation.removedNodes).some(isNodeOfInterest);
                const addedFields = Array.from(mutation.addedNodes).some(isNodeOfInterest);

                if (addedFields) onNewField(mutation.target as HTMLElement);
                if (deletedFields) onDeletedField(mutation.target as HTMLElement);

                return addedFields || deletedFields;
            }

            if (mutation.type === 'attributes') {
                const { oldValue, attributeName } = mutation;
                const target = mutation.target as HTMLElement;
                const current = attributeName ? target?.getAttribute(attributeName) : null;

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

                return hasUnprocessedFields(target);
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
     * · The detection is executed only if there are unprocessed forms
     * · The purpose is to catch appearing forms that may have been previously
     *   filtered out by the ML algorithm when it was first triggered */
    const onTransition = debounce(
        () => requestAnimationFrame(() => hasUnprocessedForms() && detect({ reason: 'TransitionEnd' })),
        250,
        { leading: true }
    );

    const observe = () => {
        if (!state.active) {
            state.active = true;
            state.observer = listeners.addObserver(document.body, onMutation, getObserverConfig(ATTRIBUTES_FILTER));
            listeners.addListener(document.body, 'transitionend', onTransition);
            listeners.addListener(document.body, 'animationend', onTransition);
        }
    };

    const destroy = () => {
        state.active = false;
        state.busy = false;
        state.observer = null;
        state.staleMutationsCount = 0;

        cancelIdleCallback(state.detectionRequest);
        runDetection.cancel();
        listeners.removeAll();

        state.trackedForms.forEach((form) => detachTrackedForm(form.element));
        state.trackedForms.clear();
    };

    const sync = () => state.trackedForms.forEach((form) => form.tracker?.reconciliate());

    return { getTrackedForms, observe, detect, sync, destroy };
};

export type FormManager = ReturnType<typeof createFormManager>;
