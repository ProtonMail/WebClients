import type { FormType } from '@proton/pass/fathom';
import type { AutosaveFormEntry, FormCredentials, FormIdentifier, TabId } from '@proton/pass/types';
import { type FormEntry, FormEntryStatus } from '@proton/pass/types';

export const getFormId = (tabId: TabId, domain: string): FormIdentifier => `${tabId}:${domain}`;

export const isFormEntryCommitted = (submission: FormEntry): submission is FormEntry<FormEntryStatus.COMMITTED> =>
    submission.status === FormEntryStatus.COMMITTED;

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
    const username = credentials.username.trim();
    const password = credentials.password.trim();

    switch (options.type) {
        case 'login':
        case 'register':
            /* In the case of login & register forms, we can sometimes end up
             * in a situation where we missed the username field detection, as
             * such, when validating these forms as non-partial: consider the
             * presence of `password` as sufficient to validate. */
            return Boolean(options.partial ? username || password : password);

        case 'password-change':
        case 'noop':
            return Boolean(password);

        default:
            return false;
    }
};
