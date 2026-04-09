import type { FormType } from '@proton/pass/fathom/labels';
import type { MaybeNull, RequiredNonNull } from '@proton/pass/types/utils';
import type { URLComponents } from '@proton/pass/utils/url/types';

import type { WithAutosavePrompt } from './autosave';
import type { FrameId, TabId } from './runtime';

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
export type FormCredentials = { userIdentifier: string; password: string };
export type FormEntryBase = FormSubmission & RequiredNonNull<URLComponents, 'domain' | 'protocol'>;

export type FormEntry<T extends FormEntryStatus = FormEntryStatus> = FormEntryBase & {
    status: T;
    submittedAt: MaybeNull<number>;
    updatedAt: number;
    /** Stored for future cross-frame autosave reconciliation. The tracker
     * currently keys entries by tab ID only; frameId is not used for lookup
     * until sub-frame field clustering is implemented. */
    frameId: FrameId;
};

export type AutosaveFormEntry<T extends FormEntryStatus = FormEntryStatus> = WithAutosavePrompt<FormEntry<T>>;
