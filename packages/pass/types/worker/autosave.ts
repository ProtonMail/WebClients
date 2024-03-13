import type { SanitizedPasskey } from '@proton/pass/lib/passkeys/types';
import type { SelectedItem } from '@proton/pass/types/data';

export enum AutosaveType {
    NEW = 'NEW',
    UPDATE = 'UPDATE',
}

export type AutosaveData =
    | { type: AutosaveType.NEW }
    | { type: AutosaveType.UPDATE; selectedItem: SelectedItem; name: string };

export type AutosavePayload = AutosaveData & {
    domain: string;
    name: string;
    passkey?: SanitizedPasskey;
    password: string;
    username: string;
};

export type AutosavePrompt = { shouldPrompt: false } | { shouldPrompt: true; data: AutosaveData };
export type WithAutosavePrompt<T, U = boolean> = T & { autosave: Extract<AutosavePrompt, { shouldPrompt: U }> };
