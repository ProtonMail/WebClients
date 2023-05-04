import { contentScriptMessage, sendMessage } from '@proton/pass/extension/message';
import { fathom } from '@proton/pass/fathom';
import type { FormEntry, PromptedFormEntry, WithAutoSavePromptOptions } from '@proton/pass/types';
import { FormEntryStatus, WorkerMessageType } from '@proton/pass/types';
import { createListenerStore } from '@proton/pass/utils/listener';
import { logger } from '@proton/pass/utils/logger';
import debounce from '@proton/utils/debounce';

import { isSubmissionCommitted } from '../../../shared/form';
import { withContext } from '../../context/context';
import { FormHandle, NotificationAction } from '../../types';

const { isVisible } = fathom.utils;

export type FormManagerContext = {
    active: boolean;
    trackedForms: FormHandle[];
};

export const createFormManager = () => {
    const ctx: FormManagerContext = { active: false, trackedForms: [] };
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
    const reconciliate: () => Promise<void> = withContext(
        async ({ getExtensionContext, service: { autofill, iframe } }) => {
            const needsDropdown = ctx.trackedForms.length > 0;
            iframe[needsDropdown ? 'attachDropdown' : 'detachDropdown']();

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

    const trackForms = (forms: FormHandle[]): void => {
        forms.forEach((detectedForm) => {
            const trackedForm = ctx.trackedForms.find((trackedForm) => detectedForm.element === trackedForm.element);

            if (!trackedForm) {
                detectedForm.attach();
                ctx.trackedForms = [...ctx.trackedForms, detectedForm];
            }
        });

        void reconciliate();
    };

    const detect: (reason: string) => void = withContext(({ service: { detector }, mainFrame }, reason) => {
        const frame = mainFrame ? 'main_frame' : 'iframe';
        logger.info(`[FormTracker::Detector]: Running detection for "${reason}" on ${frame}`);
        garbagecollect();
        trackForms(detector.runDetection(document));
    });

    const onMutation: () => void = debounce(
        withContext(({ service: { detector } }) => {
            const results = detector.reconciliate(ctx.trackedForms);
            results.removeForms.forEach(detachTrackedForm);
            return results.runDetection && detect('MutationObserver');
        }),
        250
    );

    const observe = () => {
        if (!ctx.active) {
            ctx.active = true;
            listeners.addObserver(onMutation, document.body, { childList: true, subtree: true });
            ctx.trackedForms.forEach((form) => form.attach());
        }
    };

    const destroy = () => {
        listeners.removeAll();
        ctx.trackedForms.forEach(detachTrackedForm);
        ctx.active = false;
    };

    const sync = () => ctx.trackedForms.forEach((form) => form.listFields().forEach((field) => field.sync()));

    return { getForms: () => ctx.trackedForms, observe, detect, sync, reconciliate, destroy };
};

export type FormManager = ReturnType<typeof createFormManager>;
