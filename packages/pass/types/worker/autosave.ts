import type { SanitizedPasskey } from '@proton/pass/lib/passkeys/types';
import type { SelectedItem } from '@proton/pass/types/data';
import type { SafeLoginItem } from '@proton/pass/types/worker/data';

export enum AutosaveType {
    NEW = 'NEW',
    UPDATE = 'UPDATE',
}

export type AutosaveData<Update> = { type: AutosaveType.NEW } | ({ type: AutosaveType.UPDATE } & Update);

export type AutosavePayload = AutosaveData<SelectedItem> & {
    domain: string;
    name: string;
    passkey?: SanitizedPasskey;
    password: string;
    username: string;
};

export type AutosavePrompt =
    | { shouldPrompt: false }
    | { shouldPrompt: true; data: AutosaveData<{ candidates: SafeLoginItem[] }> };

export type WithAutosavePrompt<T, U = boolean> = T & { autosave: Extract<AutosavePrompt, { shouldPrompt: U }> };
