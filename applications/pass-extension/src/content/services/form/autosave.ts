import { contentScriptMessage, sendMessage } from '@proton/pass/extension/message';
import type { FormEntryPrompt } from '@proton/pass/types';
import { FormEntryStatus, WorkerMessageType } from '@proton/pass/types';

import { isSubmissionPromptable } from '../../../shared/form';
import { withContext } from '../../context/context';
import { NotificationAction } from '../../types';

export const createAutosaveService = () => {
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
    const reconciliate: () => Promise<void> = withContext(async ({ getExtensionContext, service: { formManager } }) => {
        const submission = await sendMessage.on(
            contentScriptMessage({ type: WorkerMessageType.FORM_ENTRY_REQUEST }),
            (response) => (response.type === 'success' ? response.submission : undefined)
        );

        if (submission !== undefined) {
            const { status, partial, domain, type } = submission;
            const currentDomain = getExtensionContext().url.domain;
            const formRemoved = !formManager.getTrackedForms().some(({ formType }) => formType === type);

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
    });

    return { reconciliate };
};

export type AutosaveService = ReturnType<typeof createAutosaveService>;
