import { withContext } from 'proton-pass-extension/app/content/context/context';
import { NotificationAction } from 'proton-pass-extension/app/content/types';
import { isFormEntryPromptable, validateFormCredentials } from 'proton-pass-extension/lib/utils/form-entry';

import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message';
import type { AutosaveFormEntry } from '@proton/pass/types';
import { FormEntryStatus, WorkerMessageType } from '@proton/pass/types';

export const createAutosaveService = () => {
    /** Checks the user's settings and prompts for autosave accordingly.
     * Returns wether the autosave prompt was shown or not. */
    const promptAutoSave: (submission: AutosaveFormEntry) => boolean = withContext(
        (ctx, { domain, subdomain, autosave, data }) => {
            if (!autosave.shouldPrompt || !ctx?.getFeatures().Autosave) return false;

            ctx.service.iframe.attachNotification()?.open({
                action: NotificationAction.AUTOSAVE,
                data: { domain: subdomain ?? domain, ...autosave.data, ...data },
            });

            return true;
        }
    );

    /** Autosave reconciliation is responsible for syncing the service worker state with our
     * local detection in order to take the appropriate the appropriate action for auto-save */
    const reconciliate = withContext<() => Promise<boolean>>(async (ctx) => {
        /* Resolve any on-going submissions for the current domain */
        const submission = await sendMessage.on(
            contentScriptMessage({ type: WorkerMessageType.FORM_ENTRY_REQUEST }),
            (response) => (response.type === 'success' ? response.submission : null)
        );

        if (submission !== null) {
            const { status, domain, type, data } = submission;

            const currentDomain = ctx?.getExtensionContext().url.domain;
            const domainmatch = currentDomain === domain;

            /** Check if any of the currently tracked forms match the
             * submission's form type and are not currently submitting.
             * The submit state is checked to avoid stashing form submission
             * data for `FORM_TYPE_PRESENT` in case reconciliation happens
             * as a result of a form submission. */
            const forms = ctx?.service.formManager.getTrackedForms() ?? [];
            const typedForms = forms.filter(({ formType, detached }) => formType === type && !detached);
            const submissionTypeMatch = typedForms.length > 0;
            const submitting = typedForms.some(({ tracker }) => tracker?.getState().isSubmitting);
            const valid = submission.submitted && validateFormCredentials(data, { type, partial: false });
            const formTypeChangedOrRemoved = !submissionTypeMatch;
            const canCommit = domainmatch && formTypeChangedOrRemoved && valid;

            /* if we have a non-partial staging form submission at
             * this stage either commit it if no forms of the same
             * type are present in the DOM - or stash it if it's the
             * case : we may be dealing with a failed login */
            if (status === FormEntryStatus.STAGING && canCommit) {
                return sendMessage.on(
                    contentScriptMessage({
                        type: WorkerMessageType.FORM_ENTRY_COMMIT,
                        payload: { reason: 'FORM_TYPE_REMOVED' },
                    }),
                    (res) => (res.type === 'success' && res.submission ? promptAutoSave(res.submission) : false)
                );
            }

            if (isFormEntryPromptable(submission) && formTypeChangedOrRemoved) return promptAutoSave(submission);

            /* Stash the form submission if it meets the following conditions:
             * - The form type is still detected on the current page.
             * - The form is not currently submitting
             * - The submission is not "partial" or does not have a username value.
             * This prevents data loss on multi-step forms while properly stashing
             * when navigating back and forth on such forms. */
            if (submissionTypeMatch && !submitting && (valid || !data.username)) {
                void sendMessage(
                    contentScriptMessage({
                        type: WorkerMessageType.FORM_ENTRY_STASH,
                        payload: { reason: 'FORM_TYPE_PRESENT' },
                    })
                );
            }
        }

        return false;
    });

    return { reconciliate, promptAutoSave };
};

export type AutosaveService = ReturnType<typeof createAutosaveService>;
