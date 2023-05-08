import { contentScriptMessage, sendMessage } from '@proton/pass/extension/message';
import { fathom } from '@proton/pass/fathom';
import type { FormEntry, PromptedFormEntry, WithAutoSavePromptOptions } from '@proton/pass/types';
import { FormEntryStatus, WorkerMessageType } from '@proton/pass/types';
import { notIn, prop, truthy } from '@proton/pass/utils/fp';
import { createListenerStore } from '@proton/pass/utils/listener';
import { logger } from '@proton/pass/utils/logger';
import debounce from '@proton/utils/debounce';

import { isSubmissionCommitted } from '../../../shared/form';
import { withContext } from '../../context/context';
import { FormHandle, NotificationAction } from '../../types';

const { isVisible } = fathom.utils;

export type FormManagerContext = {
    active: boolean;
    staleForms: Map<HTMLElement, { unsubscribe: () => void }>;
    trackedForms: FormHandle[];
};

export const createFormManager = () => {
    const ctx: FormManagerContext = {
        active: false,
        staleForms: new Map(),
        trackedForms: [],
    };

    const listeners = createListenerStore();

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
    const reconciliate: (incoming: FormHandle[]) => Promise<void> = withContext(
        async ({ getExtensionContext, service: { autofill, iframe } }, incoming) => {
            ctx.trackedForms = ctx.trackedForms.concat(incoming);

            const needsDropdown = ctx.trackedForms.length > 0;
            iframe[needsDropdown ? 'attachDropdown' : 'detachDropdown']();

            incoming.forEach((form) => {
                ctx.staleForms.get(form.element)?.unsubscribe();
                form.attach();
            });

            await autofill.queryItems();

            const submission = await sendMessage.map(
                contentScriptMessage({ type: WorkerMessageType.FORM_ENTRY_REQUEST }),
                (response) => (response.type === 'success' ? response.submission : undefined)
            );

            if (submission !== undefined) {
                const { status, partial, realm, type } = submission;
                const currentRealm = getExtensionContext().realm;

                if (status === FormEntryStatus.STAGING && !partial) {
                    const realmMatch = currentRealm === realm;
                    const formRemoved = !ctx.trackedForms.some(({ formType }) => formType === type);
                    const shouldCommit = realmMatch && formRemoved;

                    if (shouldCommit) {
                        return sendMessage.onSuccess(
                            contentScriptMessage({
                                type: WorkerMessageType.FORM_ENTRY_COMMIT,
                                payload: { reason: 'INFERRED_FORM_REMOVAL' },
                            }),
                            ({ committed }) => committed !== undefined && onCommittedSubmission(committed)
                        );
                    }
                }

                if (isSubmissionCommitted(submission)) return onCommittedSubmission(submission);
            }

            iframe.detachNotification();
        }
    );

    const detachTrackedForm = (target: FormHandle) => {
        target.detach();
        ctx.trackedForms = ctx.trackedForms.filter((form) => target !== form);
    };

    /* Garbage collection is used to free resources
     * and clear listeners on any removed tracked form
     * before running any new detection on the current document */
    const garbagecollect = () => {
        ctx.trackedForms.forEach((form) => {
            if (form.shouldRemove() || !isVisible(form.element)) {
                detachTrackedForm(form);
            }
        });
    };

    /* FIXME: if a form prediction changed we should
     * update the tracked form accordingly */
    const detect: (reason: string) => void = withContext(({ service: { detector }, mainFrame }, reason) => {
        const frame = mainFrame ? 'main_frame' : 'iframe';
        logger.info(`[FormTracker::Detector]: Running detection for "${reason}" on ${frame}`);
        garbagecollect();

        const detected = detector.runDetection();
        const current = ctx.trackedForms.map(prop('element'));
        const incoming = detected.filter(({ element }) => notIn(current)(element));

        void reconciliate(incoming);
    });

    const onFormsChange = debounce(
        withContext(({ service: { detector } }) => {
            const results = detector.reconciliate(ctx.trackedForms);
            results.removeForms.forEach(detachTrackedForm);
            return results.runDetection && detect('MutationObserver');
        }),
        250,
        { leading: true }
    );

    /* The detection will only work on visible forms for performance
     * reasons. We may miss certain forms becoming visible that were
     * initially filtered out */
    const observeStaleForms = () => {
        const forms = Array.from(document.getElementsByTagName('form'));
        const untracked = forms.filter((form) => !ctx.trackedForms.some(({ element }) => element === form));

        untracked.forEach((form) => {
            form.addEventListener('animationend', onFormsChange);
            const obs = new MutationObserver(onFormsChange);

            [form, form.parentElement]
                .filter(truthy)
                .forEach((el) => obs.observe(el, { attributes: true, attributeFilter: ['style', 'class'] }));

            ctx.staleForms.set(form, {
                unsubscribe: () => {
                    form.removeEventListener('animationend', onFormsChange);
                    obs.disconnect();
                },
            });
        });
    };

    /* the mutation observer in this call will only watch for changes
     * on the body subtree - this will not catch attribute changes on
     * elements : we rely on a different mechanism to  detect these
     * changes (ie: visibility or style changes - the detectors will only
     * try to match visible forms for performance reasons) */
    const observe = () => {
        if (!ctx.active) {
            ctx.active = true;
            listeners.addObserver(onFormsChange, document.body, { childList: true, subtree: true });
            listeners.addListener(document, 'animationend', onFormsChange);
            listeners.addListener(document, 'transitionend', onFormsChange);
            observeStaleForms();
        }
    };

    const destroy = () => {
        onFormsChange.cancel();
        listeners.removeAll();
        ctx.active = false;
        ctx.trackedForms.forEach(detachTrackedForm);
        ctx.trackedForms.length = 0;
        ctx.staleForms.forEach(({ unsubscribe }) => unsubscribe());
        ctx.staleForms = new Map();
    };

    const sync = () => ctx.trackedForms.forEach((form) => form.tracker?.attach());

    return { getForms: () => ctx.trackedForms, observe, detect, sync, destroy };
};

export type FormManager = ReturnType<typeof createFormManager>;
