import type { FormType } from '@proton/pass/fathom';
import type { MaybeNull } from '@proton/pass/types/utils';

import type { WithAutosavePrompt } from './autosave';
import type { TabId } from './runtime';

export enum FormEntryStatus {
    STAGING,
    COMMITTED,
}

export type FormIdentifier = `${TabId}:${string}`;
export type FormCredentials = { username: string; password: string };
export type FormSubmission = { action?: string; data: FormCredentials; type: `${FormType}` };
export type FormEntryBase = FormSubmission & { domain: string; scheme?: string; subdomain: MaybeNull<string> };
export type FormEntry<T extends FormEntryStatus = FormEntryStatus> = FormEntryBase & { status: T };
export type AutosaveFormEntry<T extends FormEntryStatus = FormEntryStatus> = WithAutosavePrompt<FormEntry<T>>;
