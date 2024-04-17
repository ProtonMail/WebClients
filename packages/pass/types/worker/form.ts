import type { FormType } from '@proton/pass/fathom';
import type { MaybeNull } from '@proton/pass/types/utils';

import type { WithAutosavePrompt } from './autosave';
import type { TabId } from './runtime';

export enum FormEntryStatus {
    STAGING,
    COMMITTED,
}

export type FormStatusPayload = { formId: string; status: 'loading' | 'submitted' | 'error' };

export type FormSubmission = {
    /** form identifier */
    formId: string;
    /** the form action data */
    action?: string;
    /** the intercepted form submission data */
    data: FormCredentials;
    /** wether the form can be considered as loading */
    loading?: boolean;
    /** wether the form was submitted */
    submit: boolean;
    /** form type for this submission */
    type: `${FormType}`;
};

export type FormSubmitPayload = FormSubmission & { reason: string };
export type FormIdentifier = `${TabId}:${string}`;
export type FormCredentials = { username: string; password: string };
export type FormEntryBase = FormSubmission & { domain: string; scheme?: string; subdomain: MaybeNull<string> };

export type FormEntry<T extends FormEntryStatus = FormEntryStatus> = FormEntryBase & {
    status: T;
    submittedAt: MaybeNull<number>;
    updatedAt: number;
};

export type AutosaveFormEntry<T extends FormEntryStatus = FormEntryStatus> = WithAutosavePrompt<FormEntry<T>>;
