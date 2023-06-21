import { contentScriptMessage, sendMessage } from '@proton/pass/extension/message';
import { clearVisibilityCache } from '@proton/pass/fathom';
import type { FormEntry, PromptedFormEntry, WithAutoSavePromptOptions } from '@proton/pass/types';
import { FormEntryStatus, WorkerMessageType } from '@proton/pass/types';
import { createListenerStore } from '@proton/pass/utils/listener';
import { logger } from '@proton/pass/utils/logger';
import debounce from '@proton/utils/debounce';

import { isSubmissionCommitted } from '../../../shared/form';
import { withContext } from '../../context/context';
import type { FormHandle } from '../../types';
import { NotificationAction } from '../../types';
import { hasUnprocessedFields, hasUnprocessedForms, isNodeOfInterest } from '../../utils/nodes';
import { createFormHandles } from '../handles/form';

type FormManagerOptions = { onDetection: (forms: FormHandle[]) => void };

export type FormManagerContext = {
    /* form manager state flag */
    active: boolean;
    /* ongoing detection flag */
    busy: boolean;
    /* detection request */
    detectionRequest: number;
    /* tracked forms have been detected */
    trackedForms: Map<HTMLElement, FormHandle>;
};

export const createFormManager = (options: FormManagerOptions) => {
    const ctx: FormManagerContext = {
        active: false,
        busy: false,
        detectionRequest: -1,
        trackedForms: new Map(),
    };

    const listeners = createListenerStore();
    const getTrackedForms = () => Array.from(ctx.trackedForms.values());

    /* FIXME: if no autosave.prompt setting we should avoid
     * setting any listeners at all for form submissions */
    const onCommittedSubmission: (submission: WithAutoSavePromptOptions<FormEntry<FormEntryStatus.COMMITTED>>) => void =
        withContext(({ getSettings, service: { iframe } }, submission) => {
            const shouldPrompt = getSettings().autosave.prompt && submission.autosave.shouldPrompt;

            if (shouldPrompt) {
                iframe.attachNotification();
                iframe.notification?.open({
                    action: NotificationAction.AUTOSAVE_PROMPT,
                    submission: submission as PromptedFormEntry,
                });
            }
        });

    /* Reconciliation is responsible for syncing the service
     * worker state with our local detection in order to take
     * the appropriate action for auto-save */
    const reconciliate: () => Promise<void> = withContext(async ({ getExtensionContext, service: { iframe } }) => {
        const submission = await sendMessage.on(
            contentScriptMessage({ type: WorkerMessageType.FORM_ENTRY_REQUEST }),
            (response) => (response.type === 'success' ? response.submission : undefined)
        );

        if (submission !== undefined) {
            const { status, partial, domain, type } = submission;
            const currentDomain = getExtensionContext().url.domain;
            const formRemoved = !getTrackedForms().some(({ formType }) => formType === type);

            const domainmatch = currentDomain === domain;
            const canCommit = domainmatch && formRemoved;

            /* if we have a non-partial staging form submission at
             * this stage either commit it if no forms of the same
             * type are present in the DOM - or stash it if it's the
             * case : we may be dealing with a failed login */
            if (status === FormEntryStatus.STAGING && !partial && canCommit) {
                return sendMessage.onSuccess(
                    contentScriptMessage({
                        type: WorkerMessageType.FORM_ENTRY_COMMIT,
                        payload: { reason: 'FORM_TYPE_REMOVED' },
                    }),
                    ({ committed }) => committed !== undefined && onCommittedSubmission(committed)
                );
            }

            if (isSubmissionCommitted(submission) && formRemoved) return onCommittedSubmission(submission);

            if (!formRemoved) {
                void sendMessage(
                    contentScriptMessage({
                        type: WorkerMessageType.FORM_ENTRY_STASH,
                        payload: { reason: 'FORM_TYPE_PRESENT' },
                    })
                );
            }
        }

        iframe.detachNotification();
    });

    const detachTrackedForm = (formEl: HTMLElement) => {
        ctx.trackedForms.get(formEl)?.detach();
        ctx.trackedForms.delete(formEl);
    };

    /* Garbage collection is used to detach tracked forms
     * if they have been removed from the DOM - this may be the case
     * in SPA apps. Once a form is detected, it will be tracked until
     * removed : form visibility changes have no effect on detachment
     * for performance reasons (costly `isVisible` check) */
    const garbagecollect = () => {
        ctx.trackedForms.forEach((form) => form.shouldRemove() && detachTrackedForm(form.element));
    };

    /* Detection :
     * - runs in `requestAnimationFrame` to defer costly DOM operations
     * - if a stale form has been detected: unsubscribe
     * - on each detected form: recycle/create form handle and reconciliate its fields
     * Returns a boolean flag indicating wether or not the detection was ran */
    const detect = debounce(
        withContext<(reason: string) => Promise<boolean>>(async ({ service: { detector } }, reason: string) => {
            if (ctx.busy || !ctx.active) return false;
            ctx.busy = true;
            cancelIdleCallback(ctx.detectionRequest);
            garbagecollect();

            if (await detector.shouldRunDetection()) {
                ctx.detectionRequest = requestIdleCallback(() => {
                    if (ctx.active) {
                        logger.info(`[FormTracker::Detector]: Running detection for "${reason}"`);
                        const forms = detector.runDetection();

                        forms.forEach((options) => {
                            const formHandle = ctx.trackedForms.get(options.form) ?? createFormHandles(options);
                            ctx.trackedForms.set(options.form, formHandle);
                            formHandle.reconciliate(options.formType, options.fields);
                            formHandle.attach();
                        });

                        options.onDetection(getTrackedForms());
                        void reconciliate();
                        ctx.busy = false;
                    }
                });
                return true;
            } else clearVisibilityCache();

            ctx.busy = false;
            return false;
        }),
        150,
        { leading: true }
    );

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
                const newNodes = Array.from(mutation.addedNodes);
                const deletedNodes = Array.from(mutation.removedNodes);

                return (
                    newNodes.some(
                        (node) => isNodeOfInterest(node) || (node instanceof HTMLElement && hasUnprocessedFields(node))
                    ) || deletedNodes.some(isNodeOfInterest)
                );
            }

            if (mutation.type === 'attributes') {
                const target = mutation.target as HTMLElement;
                return target !== document.body && mutation.type === 'attributes' && hasUnprocessedFields(target);
            }

            return false;
        });

        if (triggerFormChange) void detect('DomMutation');
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
        () => requestAnimationFrame(() => hasUnprocessedForms() && detect('TransitionEnd')),
        250,
        { leading: true }
    );

    const observe = () => {
        if (!ctx.active) {
            ctx.active = true;

            listeners.addObserver(document.body, onMutation, {
                childList: true,
                subtree: true,
                attributeFilter: ['style', 'class'],
                attributes: true,
            });

            listeners.addListener(document.body, 'transitionend', onTransition);
            listeners.addListener(document.body, 'animationend', onTransition);
        }
    };

    const destroy = () => {
        ctx.active = false;
        ctx.busy = false;

        cancelIdleCallback(ctx.detectionRequest);
        detect.cancel();
        listeners.removeAll();

        ctx.trackedForms.forEach((form) => detachTrackedForm(form.element));
        ctx.trackedForms.clear();
    };

    const sync = () => ctx.trackedForms.forEach((form) => form.tracker?.reconciliate());

    return {
        getTrackedForms,
        observe,
        detect,
        sync,
        destroy,
        reconciliate,
    };
};

export type FormManager = ReturnType<typeof createFormManager>;
