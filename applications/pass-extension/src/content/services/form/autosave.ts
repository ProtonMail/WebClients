import { contentScriptMessage, sendMessage } from '@proton/pass/extension/message';
import type { FormEntryPrompt } from '@proton/pass/types';
import { FormEntryStatus, WorkerMessageType } from '@proton/pass/types';

import { isSubmissionPromptable } from '../../../shared/form';
import { withContext } from '../../context/context';
import { NotificationAction } from '../../types';

export const createAutosaveService = () => {
    const promptAutoSave: (submission: FormEntryPrompt) => boolean = withContext(
        ({ getSettings, service: { iframe } }, submission) => {
            const shouldPrompt = getSettings().autosave.prompt;

            if (shouldPrompt) {
                iframe.attachNotification();
                iframe.notification?.open({
                    action: NotificationAction.AUTOSAVE_PROMPT,
                    submission,
                });
                return true;
            }

            return false;
        }
    );

    /* Reconciliation is responsible for syncing the service
     * worker state with our local detection in order to take
     * the appropriate action for auto-save */
    const reconciliate = withContext<() => Promise<boolean>>(
        async ({ getExtensionContext, service: { formManager } }) => {
            const submission = await sendMessage.on(
                contentScriptMessage({ type: WorkerMessageType.FORM_ENTRY_REQUEST }),
                (response) => (response.type === 'success' ? response.submission : undefined)
            );

            if (submission !== undefined) {
                const { status, partial, domain, type } = submission;
                const currentDomain = getExtensionContext().url.domain;
                const formTypeChangeOrRemoved = !formManager
                    .getTrackedForms()
                    .some(({ formType }) => formType === type);

                const domainmatch = currentDomain === domain;
                const canCommit = domainmatch && formTypeChangeOrRemoved;

                /* if we have a non-partial staging form submission at
                 * this stage either commit it if no forms of the same
                 * type are present in the DOM - or stash it if it's the
                 * case : we may be dealing with a failed login */
                if (status === FormEntryStatus.STAGING && !partial && canCommit) {
                    return sendMessage.on(
                        contentScriptMessage({
                            type: WorkerMessageType.FORM_ENTRY_COMMIT,
                            payload: { reason: 'FORM_TYPE_REMOVED' },
                        }),
                        (res) => (res.type === 'success' && res.committed ? promptAutoSave(res.committed) : false)
                    );
                }

                if (isSubmissionPromptable(submission) && formTypeChangeOrRemoved) return promptAutoSave(submission);

                /* if the form type is still detected on the current page :
                 * only stash the form submission if it is not "partial". This
                 * avois losing form data on multi-step forms */
                if (!formTypeChangeOrRemoved && !partial) {
                    void sendMessage(
                        contentScriptMessage({
                            type: WorkerMessageType.FORM_ENTRY_STASH,
                            payload: { reason: 'FORM_TYPE_PRESENT' },
                        })
                    );
                }
            }

            return false;
        }
    );

    return { reconciliate };
};

export type AutosaveService = ReturnType<typeof createAutosaveService>;
