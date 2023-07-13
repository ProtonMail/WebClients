import { contentScriptMessage, sendMessage } from '@proton/pass/extension/message';
import { clearDetectionCache, getDetectedFormParent, getIgnoredParent, setFormProcessable } from '@proton/pass/fathom';
import type { FormEntryPrompt } from '@proton/pass/types';
import { FormEntryStatus, WorkerMessageType } from '@proton/pass/types';
import { createListenerStore } from '@proton/pass/utils/listener';
import { logger } from '@proton/pass/utils/logger';
import debounce from '@proton/utils/debounce';
import noop from '@proton/utils/noop';

import { isSubmissionPromptable } from '../../../shared/form';
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
    const promptAutoSave: (submission: FormEntryPrompt) => void = withContext(
        ({ getSettings, service: { iframe } }, submission) => {
            const shouldPrompt = getSettings().autosave.prompt;

            if (shouldPrompt) {
                iframe.attachNotification();
                iframe.notification?.open({
                    action: NotificationAction.AUTOSAVE_PROMPT,
                    submission,
                });
            }
        }
    );

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
                    ({ committed }) => committed && promptAutoSave(committed)
                );
            }

            if (isSubmissionPromptable(submission) && formRemoved) return promptAutoSave(submission);

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
    const runDetection = debounce(
        withContext<(reason: string) => Promise<boolean>>(
            async ({ destroy, service: { detector } }, reason: string) => {
                garbagecollect();
                if (await detector.shouldRunDetection()) {
                    ctx.detectionRequest = requestIdleCallback(() => {
                        ctx.busy = true;

                        if (ctx.active) {
                            logger.info(`[FormTracker::Detector] Running detection for "${reason}"`);

                            try {
                                const forms = detector.runDetection({
                                    onBottleneck: (data) => {
                                        void sendMessage(
                                            contentScriptMessage({
                                                type: WorkerMessageType.SENTRY_CS_EVENT,
                                                payload: { message: 'DetectorBottleneck', data },
                                            })
                                        ).catch(noop);

                                        destroy({ reason: 'detector bottleneck', recycle: false });
                                    },
                                });

                                forms.forEach((options) => {
                                    const formHandle = ctx.trackedForms.get(options.form) ?? createFormHandles(options);
                                    ctx.trackedForms.set(options.form, formHandle);
                                    formHandle.reconciliate(options.formType, options.fields);
                                    formHandle.attach();
                                });

                                options.onDetection(getTrackedForms());
                                void reconciliate();
                                ctx.busy = false;
                            } catch (err) {
                                logger.warn(`[FormTracker::Detector] ${err}`);
                            }
                        }
                    });

                    return true;
                } else clearDetectionCache();

                ctx.busy = false;
                return false;
            }
        ),
        250
    );

    const detect = async (options: { reason: string; flush?: boolean }) => {
        if (ctx.busy || !ctx.active) return false;
        cancelIdleCallback(ctx.detectionRequest);

        if (options.flush) {
            void runDetection(options.reason);
            return Boolean(await runDetection.flush());
        }

        return Boolean(await runDetection(options.reason));
    };

    /* if a new field was added to a currently ignored form :
     * set it as processable in case it was recycled in case
     * we need to re-run the classifiers */
    const onNewField = (field?: HTMLElement) => {
        const ignored = getIgnoredParent(field);
        if (ignored) setFormProcessable(ignored);
    };

    /* if a field was deleted inside a currently detected
     * form, un-flag it if the form is recycled and could have
     * its predicted class change */
    const onDeletedField = (field?: HTMLElement) => {
        const detected = getDetectedFormParent(field);
        if (detected) setFormProcessable(detected);
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
                const deletedFields = Array.from(mutation.removedNodes).some(isNodeOfInterest);
                const addedFields = Array.from(mutation.addedNodes).some(isNodeOfInterest);

                if (addedFields) onNewField(mutation.target as HTMLElement);
                if (deletedFields) onDeletedField(mutation.target as HTMLElement);

                return addedFields || deletedFields;
            }

            if (mutation.type === 'attributes') {
                const target = mutation.target as HTMLElement;
                return target !== document.body && mutation.type === 'attributes' && hasUnprocessedFields(target);
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
        runDetection.cancel();
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
