import type { FormType } from '@proton/pass/fathom';
import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import type { AutosaveFormEntry, FormCredentials, FormSubmitPayload } from '@proton/pass/types';
import { type FormEntry, FormEntryStatus, WorkerMessageType } from '@proton/pass/types';

export const stash = (reason: string) =>
    sendMessage(contentScriptMessage({ type: WorkerMessageType.FORM_ENTRY_STASH, payload: { reason } }));

export const stage = (payload: FormSubmitPayload) =>
    sendMessage(contentScriptMessage({ type: WorkerMessageType.FORM_ENTRY_STAGE, payload }));

export const commit = (reason: string) =>
    sendMessage(contentScriptMessage({ type: WorkerMessageType.FORM_ENTRY_COMMIT, payload: { reason } }));

export const isFormEntryCommitted = (submission: FormEntry): submission is FormEntry<FormEntryStatus.COMMITTED> =>
    submission.status === FormEntryStatus.COMMITTED;

export const setFormEntryStatus = <T extends FormEntryStatus>(submission: FormEntry, status: T): FormEntry<T> => {
    submission.status = status;
    return submission as FormEntry<T>;
};

export const isFormEntryPromptable = (
    submission: AutosaveFormEntry
): submission is AutosaveFormEntry<FormEntryStatus.COMMITTED> =>
    isFormEntryCommitted(submission) && submission.autosave.shouldPrompt;

/** Validates form credentials based on the provided options. Accounts
 * for different form types and adapts validation. If `options.partial`
 * is true, partial credentials should be considered valid. */
export const validateFormCredentials = (
    credentials: FormCredentials,
    options: { type: `${FormType}`; partial: boolean }
): boolean => {
    const userIdentifier = credentials.userIdentifier.trim();
    const password = credentials.password.trim();

    switch (options.type) {
        case 'login':
        case 'register':
            /* In the case of login & register forms, we can sometimes end up
             * in a situation where we missed the username field detection, as
             * such, when validating these forms as non-partial: consider the
             * presence of `password` as sufficient to validate. */
            return Boolean(options.partial ? userIdentifier || password : password);

        case 'password-change':
        case 'noop':
            return Boolean(password);

        default:
            return false;
    }
};
