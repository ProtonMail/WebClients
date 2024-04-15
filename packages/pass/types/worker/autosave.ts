import type { SanitizedPasskey } from '@proton/pass/lib/passkeys/types';
import type { SelectedItem } from '@proton/pass/types/data';
import type { MaybeNull } from '@proton/pass/types/utils';
import type { SafeLoginItem } from '@proton/pass/types/worker/data';

export enum AutosaveMode {
    NEW = 'NEW',
    UPDATE = 'UPDATE',
}

export type AutosaveData = { domain: string; password: string; username: string };
export type AutosaveRequestData = AutosaveData & { name: string; passkey?: SanitizedPasskey };
export type AutosaveType<UpdatePayload> = { type: AutosaveMode.NEW } | ({ type: AutosaveMode.UPDATE } & UpdatePayload);
export type AutosaveRequest = AutosaveType<SelectedItem> & AutosaveRequestData;

/** `submittedAt` is used to infer if the autosave payload
 * resulted from an actual form submission.*/
export type AutosavePayload = AutosaveType<{ candidates: SafeLoginItem[] }> &
    AutosaveData & { submittedAt: MaybeNull<number> };

export type AutosavePrompt =
    | { shouldPrompt: false }
    | { shouldPrompt: true; data: AutosaveType<{ candidates: SafeLoginItem[] }> };

export type WithAutosavePrompt<T> = T & { autosave: AutosavePrompt };
