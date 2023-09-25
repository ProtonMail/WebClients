import type { FormEntryPrompt, WithAutoSavePromptOptions } from '@proton/pass/types';
import { type FormEntry, FormEntryStatus } from '@proton/pass/types';

export const isFormEntryCommitted = (submission: FormEntry): submission is FormEntry<FormEntryStatus.COMMITTED> =>
    submission.status === FormEntryStatus.COMMITTED;

export const isFormEntryPromptable = (
    submission: WithAutoSavePromptOptions<FormEntry>
): submission is FormEntryPrompt => isFormEntryCommitted(submission) && submission.autosave.shouldPrompt;

export const isFormEntryCommittable = (submission: FormEntry): submission is FormEntry<FormEntryStatus.COMMITTED> =>
    submission.partial === false && isFormEntryCommitted(submission);
