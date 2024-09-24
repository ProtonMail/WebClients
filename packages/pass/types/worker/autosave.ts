import type { SanitizedPasskey } from '@proton/pass/lib/passkeys/types';
import type { SelectedItem, SelectedShare } from '@proton/pass/types/data';
import type { MaybeNull } from '@proton/pass/types/utils';
import type { LoginItemPreview } from '@proton/pass/types/worker/data';
import type { FormCredentials } from '@proton/pass/types/worker/form';

export enum AutosaveMode {
    NEW = 'NEW',
    UPDATE = 'UPDATE',
}

type AutosaveCreate<DTO = {}> = { type: AutosaveMode.NEW } & DTO;
type AutosaveUpdate<DTO = {}> = { type: AutosaveMode.UPDATE } & DTO;
type AutosaveCandidates = { candidates: LoginItemPreview[] };

type AutosaveCreateDTO = AutosaveCreate<SelectedShare>;
type AutosaveUpdateDTO = AutosaveUpdate<SelectedItem>;
type AutosaveRequestData = FormCredentials & { name: string; passkey?: SanitizedPasskey };
export type AutosaveRequest = (AutosaveCreateDTO | AutosaveUpdateDTO) & AutosaveRequestData;

/** `submittedAt` is used to infer if the autosave payload
 * resulted from an actual form submission. */

type AutosaveCreatePayload = AutosaveCreate;
type AutosaveUpdatePayload = AutosaveUpdate<AutosaveCandidates>;
type AutosavePayloadData = FormCredentials & { submittedAt: MaybeNull<number> };
export type AutosavePayload = (AutosaveCreatePayload | AutosaveUpdatePayload) & AutosavePayloadData;

type AutosavePromptData = AutosaveCreate | AutosaveUpdate<AutosaveCandidates>;
export type AutosavePrompt = { shouldPrompt: false } | { shouldPrompt: true; data: AutosavePromptData };
export type WithAutosavePrompt<T> = T & { autosave: AutosavePrompt };
