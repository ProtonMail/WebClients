import { withContext } from 'proton-pass-extension/app/content/context/context';
import { NotificationAction } from 'proton-pass-extension/app/content/types';
import {
    commit,
    isFormEntryPromptable,
    stash,
    validateFormCredentials,
} from 'proton-pass-extension/lib/utils/form-entry';

import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import type { AutosaveFormEntry } from '@proton/pass/types';
import { FormEntryStatus, WorkerMessageType } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import debounce from '@proton/utils/debounce';
import noop from '@proton/utils/noop';

export const createAutosaveService = () => {
    /** Checks the user's settings and prompts for autosave accordingly.
     * Returns wether the autosave prompt was shown or not. */
    const promptAutoSave: (submission: AutosaveFormEntry) => boolean = withContext(
        (ctx, { domain, subdomain, autosave, data, submittedAt }) => {
            if (!autosave.shouldPrompt || !ctx?.getFeatures().Autosave) return false;

            ctx.service.iframe.attachNotification()?.open({
                action: NotificationAction.AUTOSAVE,
                data: { domain: subdomain ?? domain, ...autosave.data, ...data, submittedAt },
            });

            return true;
        }
    );

    /** Autosave reconciliation is responsible for syncing the service worker state
     * with our local detection in order to take the appropriate action for auto-save. */
    const reconciliate = debounce(
        withContext<() => Promise<boolean>>(async (ctx) => {
            /* Resolve any on-going submissions for the current domain */
            const submission = await sendMessage.on(
                contentScriptMessage({ type: WorkerMessageType.FORM_ENTRY_REQUEST }),
                (response) => (response.type === 'success' ? response.submission : null)
            );

            /* no submissions : early return */
            if (!submission) return false;

            const { status, domain, type, data, formId, submittedAt } = submission;
            const currentDomain = ctx?.getExtensionContext().url.domain;
            const domainmatch = currentDomain === domain;

            /** Check if any of the currently tracked forms match the
             * submission's form type and are not currently submitting.
             * The submit state is checked to avoid stashing form submission
             * data for `FORM_TYPE_PRESENT` in case reconciliation happens
             * as a result of a form submission. */
            const forms = ctx?.service.formManager.getTrackedForms() ?? [];
            const form = forms.find(({ id }) => id === formId);
            const typedForms = forms.filter(({ formType, detached }) => formType === type && !detached);
            const submissionTypeMatch = typedForms.length > 0;
            const loading = typedForms.some(({ tracker }) => tracker?.getState().processing);
            const submitted = submittedAt !== null;
            const valid = submitted && validateFormCredentials(data, { type, partial: false });
            const shouldCommit = status === FormEntryStatus.STAGING && domainmatch && !submissionTypeMatch && valid;

            logger.debug(`[Autosave] Reconciliating [formId:${formId}]`);

            if (loading) {
                logger.debug(`[Autosave] submission loading [formId:${formId}]`);
                return false;
            }

            /* if we have a non-partial staging form submission at
             * this stage either commit it if no forms of the same
             * type are present in the DOM - or stash it if it's the
             * case : we may be dealing with a failed login */
            if (shouldCommit) {
                const res = await commit('AUTOSAVE::FORM_REMOVED');
                return res.type === 'success' && res.submission ? promptAutoSave(res.submission) : false;
            }

            if (isFormEntryPromptable(submission) && !submissionTypeMatch) return promptAutoSave(submission);

            /* Stash the form submission if it meets the following conditions:
             * - The form type is still detected on the current page.
             * - The form is not currently submitting
             * - The submission is not "partial" or does not have a username/email value.
             * This prevents data loss on multi-step forms while properly stashing
             * when navigating back and forth on such forms. */
            if (submissionTypeMatch) {
                if (valid || !data.userIdentifier) {
                    /** If the exact form is still present : flag it as not submitted */
                    if (form) form.tracker?.sync({ submit: false, partial: true, reset: true }).catch(noop);
                    else {
                        logger.debug(`[Autosave] Stashing for type match [type:${type}]`);
                        typedForms.forEach(({ tracker }) => tracker?.reset());
                        void stash('FORM_TYPE_PRESENT');
                    }
                }
            }

            return false;
        }),
        250
    );

    return { promptAutoSave, reconciliate };
};

export type AutosaveService = ReturnType<typeof createAutosaveService>;
