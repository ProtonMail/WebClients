import type { SanitizedPasskey } from '@proton/pass/lib/passkeys/types';
import type { SelectedItem, SelectedShare } from '@proton/pass/types/data';
import type { MaybeNull } from '@proton/pass/types/utils';
import type { LoginItemPreview } from '@proton/pass/types/worker/data';

export enum AutosaveMode {
    NEW = 'NEW',
    UPDATE = 'UPDATE',
}

export type AutosaveData = { domain: string; password: string; userIdentifier: string };
export type AutosaveRequestData = AutosaveData & { name: string; passkey?: SanitizedPasskey };

type AutosaveCreate<DTO = {}> = { type: AutosaveMode.NEW } & DTO;
type AutosaveUpdate<DTO = {}> = { type: AutosaveMode.UPDATE } & DTO;

export type AutosaveCreateDTO = AutosaveCreate<SelectedShare>;
export type AutosaveUpdateDTO = AutosaveUpdate<SelectedItem>;
export type AutosaveRequest = (AutosaveCreateDTO | AutosaveUpdateDTO) & AutosaveRequestData;

type AutosaveCandidates = { candidates: LoginItemPreview[] };

/** `submittedAt` is used to infer if the autosave payload
 * resulted from an actual form submission. */
type AutosavePayloadBase = AutosaveData & { submittedAt: MaybeNull<number> };
type AutosaveCreatePayload = AutosaveCreate;
type AutosaveUpdatePayload = AutosaveUpdate<AutosaveCandidates>;
export type AutosavePayload = (AutosaveCreatePayload | AutosaveUpdatePayload) & AutosavePayloadBase;

type AutosavePromptData = AutosaveCreate | AutosaveUpdate<AutosaveCandidates>;
export type AutosavePrompt = { shouldPrompt: false } | { shouldPrompt: true; data: AutosavePromptData };
export type WithAutosavePrompt<T> = T & { autosave: AutosavePrompt };
